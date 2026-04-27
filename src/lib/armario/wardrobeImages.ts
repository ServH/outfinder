import { Directory, File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { WardrobePersistenceError } from "./wardrobeErrors";

/**
 * Wardrobe item image encoders. Each helper resolves with a `file://` URI
 * pointing to a WebP inside `Paths.cache + /wardrobe-tmp/` with a
 * deterministic `<uuid>` basename so `rollbackWardrobeFiles` can delete it
 * later without tracking its nondeterministic manipulator output.
 */

const TMP_SUBDIR = "wardrobe-tmp";
const MASTER_COMPRESS = 0.9;
const THUMB_COMPRESS = 0.75;
const THUMB_WIDTH = 300;
const DISK_FULL_REGEX =
	/not enough space|insufficient storage|permission|not permitted/i;

function ensureTmpDirectory(): Directory {
	const dir = new Directory(Paths.cache, TMP_SUBDIR);
	dir.create({ intermediates: true, idempotent: true });
	return dir;
}

async function encodeAndPark(
	cutoutUri: string,
	targetBasename: string,
	compress: number,
	actions: Parameters<typeof manipulateAsync>[1],
): Promise<string> {
	try {
		const result = await manipulateAsync(cutoutUri, actions ?? [], {
			compress,
			format: SaveFormat.WEBP,
		});
		const tmpDir = ensureTmpDirectory();
		const source = new File(result.uri);
		const destination = new File(tmpDir, targetBasename);
		source.move(destination);
		return destination.uri;
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		if (DISK_FULL_REGEX.test(message)) {
			throw new WardrobePersistenceError("diskFull", message);
		}
		throw new WardrobePersistenceError("encode", message);
	}
}

/**
 * Encodes the cutout at `cutoutUri` to WebP (quality 0.9, alpha preserved)
 * and parks the result at `Paths.cache + /wardrobe-tmp/<uuid>.webp`.
 * The caller is expected to call `moveToWardrobe` next to atomically move
 * the file to its final location.
 */
export async function encodeMaster(
	cutoutUri: string,
	uuid: string,
): Promise<string> {
	return encodeAndPark(cutoutUri, `${uuid}.webp`, MASTER_COMPRESS, []);
}

/**
 * Encodes a 300-wide WebP thumbnail (quality 0.75) from `cutoutUri` and
 * parks the result at `Paths.cache + /wardrobe-tmp/<uuid>-thumb.webp`.
 *
 * Only `width` is passed to `manipulateAsync.resize` so the source aspect
 * ratio is preserved — passing both dimensions force-stretches the image
 * and produces the squashed thumbnails seen pre-15.2 hotfix.
 */
export async function encodeThumbnail(
	cutoutUri: string,
	uuid: string,
): Promise<string> {
	return encodeAndPark(cutoutUri, `${uuid}-thumb.webp`, THUMB_COMPRESS, [
		{ resize: { width: THUMB_WIDTH } },
	]);
}
