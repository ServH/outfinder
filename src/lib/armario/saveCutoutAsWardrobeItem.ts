import { File } from "expo-file-system";
import { PREMIUM_CONFIG } from "@/config/premium";
import { uuidv4 } from "@/lib/uuid";
import { addItem, getItems, removeItem } from "@/lib/wardrobeRepo";
import {
	type WardrobeCategory,
	WardrobeLimitExceeded,
} from "@/lib/wardrobeTypes";
import { hydrateMisLooksStore, useMisLooksStore } from "@/stores/misLooksStore";
import { WardrobePersistenceError } from "./wardrobeErrors";
import {
	ensureWardrobeDirectories,
	moveToWardrobe,
	rollbackWardrobeFiles,
} from "./wardrobeFiles";
import { encodeMaster, encodeThumbnail } from "./wardrobeImages";

export interface SaveCutoutArgs {
	cutoutUri: string;
	sourceUri: string;
	isPremium: boolean;
	category: WardrobeCategory;
}

export interface SaveCutoutResult {
	id: string;
}

/**
 * Persists a Vision-derived tmp cutout PNG as a durable wardrobe item.
 *
 * Pipeline (atomic lifecycle — see story 13.3b §Atomic lifecycle contract):
 *   1. Pre-flight paywall gate (free-tier + repo.getItems() >= FREE_WARDROBE_LIMIT).
 *   2. Allocate filename uuid upfront so rollback can target all candidate paths.
 *   3. Ensure managed directories exist.
 *   4. Encode master (WebP q=0.9, alpha preserved) + thumbnail (WebP q=0.75, 300×360)
 *      into `Paths.cache + /wardrobe-tmp/`.
 *   5. Atomically move both tmp files to their final destinations:
 *         master → Paths.document + /wardrobe/<uuid>.webp       (backed up)
 *         thumb  → Paths.cache    + /wardrobe-thumbs/<uuid>.webp (regenerable — excluded via cache)
 *   6. Commit the repo row via `wardrobeRepo.addItem` (defensive paywall race handler).
 *   7. Fire-and-forget delete the original tmp PNG at `args.cutoutUri`.
 *
 * Rollback invariant (§Atomic lifecycle contract): on any `throw` the helper
 * deletes all 4 candidate paths for the allocated uuid AND defensively removes
 * the repo row if a commit had already succeeded. The original tmp cutout PNG
 * is NEVER deleted on rollback — the user must retain the ability to tap
 * Repetir or Usar esta foto again with the same source.
 *
 * Errors (see `WardrobePersistenceError.kind`):
 *   `paywall`   — free-tier at FREE_WARDROBE_LIMIT (pre-flight OR repo race)
 *   `encode`    — WebP re-encode threw from expo-image-manipulator
 *   `move`      — `File.move()` threw with a non-disk-full message
 *   `diskFull`  — `File.move()` / `Directory.create()` threw a disk-full / permission message
 *   `repoAdd`   — post-move failure not covered above (catch-all for future pipeline extensions)
 */
export async function saveCutoutAsWardrobeItem(
	args: SaveCutoutArgs,
): Promise<SaveCutoutResult> {
	// Defensive hydration gate — in practice the user cannot reach the Preview
	// screen before hydration finishes (app boot → permission → photo → ~1s
	// Vision call ≫ AsyncStorage read). Near-zero overhead if already hydrated.
	if (!useMisLooksStore.getState().hydrated) {
		await hydrateMisLooksStore();
	}

	// (1) Pre-flight paywall gate — authoritative; the repo's own gate is a
	//     defensive secondary for race conditions.
	if (
		!args.isPremium &&
		getItems().length >= PREMIUM_CONFIG.FREE_WARDROBE_LIMIT
	) {
		throw new WardrobePersistenceError(
			"paywall",
			"Free-tier wardrobe limit reached",
		);
	}

	// (2) Allocate filename uuid upfront so rollback targets all candidates
	//     regardless of which step failed.
	const uuid = uuidv4();
	let committedItemId: string | null = null;

	try {
		// (3) Ensure managed directories exist.
		ensureWardrobeDirectories();

		// (4) Encode master + thumbnail into tmp/.
		const tmpMasterUri = await encodeMaster(args.cutoutUri, uuid);
		const tmpThumbUri = await encodeThumbnail(args.cutoutUri, uuid);

		// (5) Atomic move (may throw diskFull/move).
		const { localImagePath, thumbnailPath } = await moveToWardrobe({
			tmpMasterUri,
			tmpThumbUri,
			uuid,
		});

		// (6) Commit repo row. Throws `WardrobeLimitExceeded` on race.
		const item = addItem(
			{ localImagePath, thumbnailPath, category: args.category },
			args.isPremium,
		);
		committedItemId = item.id;

		// (7) Fire-and-forget tmp PNG cleanup — never block resolution.
		try {
			new File(args.cutoutUri).delete();
		} catch (e) {
			if (__DEV__) {
				console.warn("[saveCutout] tmp cutout cleanup failed:", e);
			}
		}

		return { id: item.id };
	} catch (e) {
		rollbackWardrobeFiles(uuid);
		if (committedItemId !== null) {
			try {
				removeItem(committedItemId);
			} catch (err) {
				if (__DEV__) {
					console.warn("[saveCutout] defensive row rollback failed:", err);
				}
			}
		}

		if (e instanceof WardrobePersistenceError) throw e;
		if (e instanceof WardrobeLimitExceeded) {
			throw new WardrobePersistenceError("paywall", e.message);
		}
		const msg = e instanceof Error ? e.message : String(e);
		throw new WardrobePersistenceError("repoAdd", msg);
	}
}
