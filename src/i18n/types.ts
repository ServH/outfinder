import type en from "./locales/en.json";
import type es from "./locales/es.json";

// Flatten nested keys with dot notation
type FlattenKeys<T, Prefix extends string = ""> = T extends object
	? {
			[K in keyof T]: FlattenKeys<
				T[K],
				Prefix extends "" ? `${K & string}` : `${Prefix}.${K & string}`
			>;
		}[keyof T]
	: Prefix;

export type TranslationKey = FlattenKeys<typeof en>;

// Build-time assertion: es.json must have the same structure as en.json.
// If a key is missing in es.json, TypeScript will emit a compile error here.
type AssertSameKeys = typeof es extends typeof en
	? typeof en extends typeof es
		? true
		: never
	: never;
const _typeCheck: AssertSameKeys = true;
void _typeCheck;
