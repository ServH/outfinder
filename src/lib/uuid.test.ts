import { uuidv4 } from "./uuid";

const RFC4122_V4 =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuidv4", () => {
	it("returns an RFC4122 v4 string", () => {
		expect(uuidv4()).toMatch(RFC4122_V4);
	});

	it("returns a different value on each call", () => {
		const a = uuidv4();
		const b = uuidv4();
		expect(a).not.toBe(b);
	});

	describe("when globalThis.crypto.randomUUID is available", () => {
		const originalCrypto = (globalThis as { crypto?: unknown }).crypto;

		afterEach(() => {
			Object.defineProperty(globalThis, "crypto", {
				value: originalCrypto,
				configurable: true,
				writable: true,
			});
		});

		it("delegates to crypto.randomUUID", () => {
			const stub = jest
				.fn()
				.mockReturnValue("11111111-1111-4111-8111-111111111111");
			Object.defineProperty(globalThis, "crypto", {
				value: { randomUUID: stub },
				configurable: true,
				writable: true,
			});

			const id = uuidv4();

			expect(stub).toHaveBeenCalledTimes(1);
			expect(id).toBe("11111111-1111-4111-8111-111111111111");
		});
	});

	describe("when globalThis.crypto exists but randomUUID is undefined", () => {
		const originalCrypto = (globalThis as { crypto?: unknown }).crypto;

		beforeEach(() => {
			Object.defineProperty(globalThis, "crypto", {
				value: {},
				configurable: true,
				writable: true,
			});
		});

		afterEach(() => {
			Object.defineProperty(globalThis, "crypto", {
				value: originalCrypto,
				configurable: true,
				writable: true,
			});
		});

		it("falls back to a Math.random RFC4122 v4 string", () => {
			const id = uuidv4();
			expect(id).toMatch(RFC4122_V4);
		});
	});

	describe("when globalThis.crypto is absent", () => {
		const originalCrypto = (globalThis as { crypto?: unknown }).crypto;

		beforeEach(() => {
			Object.defineProperty(globalThis, "crypto", {
				value: undefined,
				configurable: true,
				writable: true,
			});
		});

		afterEach(() => {
			Object.defineProperty(globalThis, "crypto", {
				value: originalCrypto,
				configurable: true,
				writable: true,
			});
		});

		it("falls back to a Math.random RFC4122 v4 string", () => {
			const id = uuidv4();
			expect(id).toMatch(RFC4122_V4);
		});
	});
});
