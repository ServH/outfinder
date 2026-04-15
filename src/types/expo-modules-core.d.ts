// Ambient declaration for expo-modules-core.
// expo-modules-core is a transitive dependency (via expo-camera, etc.) and IS
// available at runtime, but pnpm does not hoist it to node_modules directly.
// This declaration satisfies TypeScript's module resolution at compile time.
declare module "expo-modules-core" {
	export function requireNativeModule<
		T = Record<string, (...args: unknown[]) => unknown>,
	>(name: string): T;
}
