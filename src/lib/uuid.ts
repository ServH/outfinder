/**
 * RFC4122 v4 UUID generator. Uses Hermes' built-in `globalThis.crypto.randomUUID`
 * when available (RN 0.74+ on iOS), falls back to a Math.random-based string.
 *
 * IDs are local-only (wardrobe item rows in AsyncStorage); no secrets, no server
 * exchange — the fallback's lack of cryptographic strength is acceptable.
 */
export function uuidv4(): string {
	const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
	if (c?.randomUUID) return c.randomUUID();
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
		const r = (Math.random() * 16) | 0;
		const v = ch === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
