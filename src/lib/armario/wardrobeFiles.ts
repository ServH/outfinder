import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import type { WardrobeItem } from "@/lib/wardrobeTypes";
import { WardrobePersistenceError } from "./wardrobeErrors";

/**
 * File-system helpers for the Armario persistence pipeline.
 *
 * Layout:
 *   Paths.cache    + /wardrobe-tmp/       — staging area, written by wardrobeImages.ts
 *   Paths.document + /wardrobe/           — masters (backed up — user data)
 *   Paths.cache    + /wardrobe-thumbs/    — thumbs (regeneratable — excluded from backup via cache)
 */

const TMP_SUBDIR = "wardrobe-tmp";
const MASTER_SUBDIR = "wardrobe";
const THUMB_SUBDIR = "wardrobe-thumbs";
const LAST_SWEEP_KEY = "@wardrobe:last_sweep_at";

/** Throttle window for `runOrphanSweep`. Exported for tests. */
export const ORPHAN_SWEEP_TTL_MS = 86_400_000; // 24h

/** Grace window for in-flight saves. Exported for tests. */
export const ORPHAN_GRACE_MS = 60_000; // 60s

const DISK_FULL_REGEX =
	/not enough space|insufficient storage|permission|not permitted/i;

function masterFileFor(uuid: string): File {
	return new File(Paths.document, MASTER_SUBDIR, `${uuid}.webp`);
}

function thumbFileFor(uuid: string): File {
	return new File(Paths.cache, THUMB_SUBDIR, `${uuid}.webp`);
}

function tmpMasterFileFor(uuid: string): File {
	return new File(Paths.cache, TMP_SUBDIR, `${uuid}.webp`);
}

function tmpThumbFileFor(uuid: string): File {
	return new File(Paths.cache, TMP_SUBDIR, `${uuid}-thumb.webp`);
}

/**
 * Creates `Paths.document + /wardrobe/` and `Paths.cache + /wardrobe-thumbs/`
 * (both idempotent). Safe to call on every save.
 */
export function ensureWardrobeDirectories(): void {
	new Directory(Paths.document, MASTER_SUBDIR).create({
		intermediates: true,
		idempotent: true,
	});
	new Directory(Paths.cache, THUMB_SUBDIR).create({
		intermediates: true,
		idempotent: true,
	});
}

function mapMoveError(e: unknown): WardrobePersistenceError {
	const message = e instanceof Error ? e.message : String(e);
	if (DISK_FULL_REGEX.test(message)) {
		return new WardrobePersistenceError("diskFull", message);
	}
	return new WardrobePersistenceError("move", message);
}

/**
 * Moves both tmp files to their final destinations. On any move failure,
 * maps the SDK error to a typed `WardrobePersistenceError` (`diskFull` if
 * the message matches the disk-full regex, otherwise `move`).
 *
 * The caller is responsible for calling `rollbackWardrobeFiles` on failure —
 * this helper never rolls back on its own.
 */
export async function moveToWardrobe(args: {
	tmpMasterUri: string;
	tmpThumbUri: string;
	uuid: string;
}): Promise<{ localImagePath: string; thumbnailPath: string }> {
	const masterDest = masterFileFor(args.uuid);
	const thumbDest = thumbFileFor(args.uuid);

	try {
		new File(args.tmpMasterUri).move(masterDest);
	} catch (e) {
		throw mapMoveError(e);
	}

	try {
		new File(args.tmpThumbUri).move(thumbDest);
	} catch (e) {
		throw mapMoveError(e);
	}

	return {
		localImagePath: masterDest.uri,
		thumbnailPath: thumbDest.uri,
	};
}

/**
 * Fire-and-forget: deletes all 4 candidate paths for `uuid`. Per-file
 * failures are swallowed (missing files are expected — normal rollback).
 */
export function rollbackWardrobeFiles(uuid: string): void {
	const candidates = [
		tmpMasterFileFor(uuid),
		tmpThumbFileFor(uuid),
		masterFileFor(uuid),
		thumbFileFor(uuid),
	];
	for (const file of candidates) {
		try {
			file.delete();
		} catch (e) {
			if (__DEV__) {
				console.warn(
					`[wardrobeFiles] rollback delete failed for ${file.uri}:`,
					e,
				);
			}
		}
	}
}

function basenameWithoutExtension(uri: string): string {
	const lastSlash = uri.lastIndexOf("/");
	const basename = lastSlash >= 0 ? uri.slice(lastSlash + 1) : uri;
	const dot = basename.lastIndexOf(".");
	return dot > 0 ? basename.slice(0, dot) : basename;
}

function collectReferencedIds(items: WardrobeItem[]): Set<string> {
	// Source of truth: the on-disk filename encoded in the item's path. The
	// helper allocates a filename uuid upfront and the repo allocates its own
	// WardrobeItem.id independently — so we compare to path basenames here
	// (the sweep can't see item.id on disk).
	const set = new Set<string>();
	for (const item of items) {
		set.add(basenameWithoutExtension(item.localImagePath));
		set.add(basenameWithoutExtension(item.thumbnailPath));
	}
	return set;
}

async function readLastSweepAt(): Promise<number | null> {
	try {
		const raw = await AsyncStorage.getItem(LAST_SWEEP_KEY);
		if (raw === null) return null;
		const parsed = Number.parseInt(raw, 10);
		return Number.isFinite(parsed) ? parsed : null;
	} catch (e) {
		if (__DEV__) {
			console.warn("[wardrobeFiles] readLastSweepAt failed:", e);
		}
		return null;
	}
}

async function writeLastSweepAt(now: number): Promise<void> {
	try {
		await AsyncStorage.setItem(LAST_SWEEP_KEY, now.toString());
	} catch (e) {
		if (__DEV__) {
			console.warn("[wardrobeFiles] writeLastSweepAt failed:", e);
		}
	}
}

function sweepDirectory(
	dir: Directory,
	refSet: Set<string>,
	now: number,
): void {
	const entries = dir.list();
	for (const entry of entries) {
		// Defensive: directories are not expected inside managed dirs.
		if (!(entry instanceof File)) continue;
		const basename = basenameWithoutExtension(entry.uri);
		if (refSet.has(basename)) continue;
		const mtime = entry.modificationTime;
		if (mtime === null) continue; // conservative — don't delete unknown-age files
		if (now - mtime <= ORPHAN_GRACE_MS) continue;
		try {
			entry.delete();
		} catch (e) {
			if (__DEV__) {
				console.warn(
					`[wardrobeFiles] orphan delete failed for ${entry.uri}:`,
					e,
				);
			}
		}
	}
}

/**
 * Janitor for orphan wardrobe files. Called at app module load and on
 * `AppState = "active"`. Throttled to once per 24h via AsyncStorage key
 * `@wardrobe:last_sweep_at`.
 *
 * Per-directory listing errors are swallowed so a missing cache subdir on
 * first launch never throws. The timestamp is only written on a fully
 * successful sweep — a failure retries on the next foreground transition.
 */
export async function runOrphanSweep(args: {
	items: WardrobeItem[];
}): Promise<void> {
	const now = Date.now();
	const lastSweepAt = await readLastSweepAt();
	if (lastSweepAt !== null && now - lastSweepAt < ORPHAN_SWEEP_TTL_MS) {
		return;
	}

	const refSet = collectReferencedIds(args.items);

	let hadError = false;
	const dirs = [
		new Directory(Paths.document, MASTER_SUBDIR),
		new Directory(Paths.cache, THUMB_SUBDIR),
	];
	for (const dir of dirs) {
		try {
			sweepDirectory(dir, refSet, now);
		} catch (e) {
			hadError = true;
			if (__DEV__) {
				console.warn(`[wardrobeFiles] sweep list failed for ${dir.uri}:`, e);
			}
		}
	}

	if (!hadError) {
		await writeLastSweepAt(now);
	}
}
