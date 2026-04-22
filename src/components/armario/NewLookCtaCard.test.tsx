import { fireEvent, render, screen } from "@testing-library/react-native";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

jest.mock("expo-symbols", () => ({
	SymbolView: ({ name, testID }: { name: string; testID?: string }) => {
		const { View } = require("react-native");
		return <View testID={testID ?? `symbol-${name}`} />;
	},
}));

import { hapticLight } from "@/lib/haptics";
import { NewLookCtaCard } from "./NewLookCtaCard";

describe("NewLookCtaCard", () => {
	beforeEach(() => {
		(hapticLight as jest.Mock).mockClear();
	});

	it("renders title + subtitle from i18n keys", () => {
		render(<NewLookCtaCard onPress={jest.fn()} />);
		expect(screen.getByText("favorites.newLookCta.title")).toBeTruthy();
		expect(screen.getByText("favorites.newLookCta.subtitle")).toBeTruthy();
	});

	it("tap fires hapticLight and calls onPress", () => {
		const onPress = jest.fn();
		render(<NewLookCtaCard onPress={onPress} />);
		fireEvent.press(screen.getByTestId("mis-looks-new-look-cta"));
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it("renders sparkles SF Symbol + chevron.right trailing glyph", () => {
		render(<NewLookCtaCard onPress={jest.fn()} />);
		expect(screen.getByTestId("symbol-sparkles")).toBeTruthy();
		expect(screen.getByTestId("symbol-chevron.right")).toBeTruthy();
	});

	it("has correct accessibility contract (role=button + label + hint)", () => {
		render(<NewLookCtaCard onPress={jest.fn()} />);
		const cta = screen.getByTestId("mis-looks-new-look-cta");
		expect(cta.props.accessibilityRole).toBe("button");
		expect(cta.props.accessibilityLabel).toBe("favorites.newLookCta.a11yLabel");
		expect(cta.props.accessibilityHint).toBe("favorites.newLookCta.a11yHint");
	});
});
