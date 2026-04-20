import { fireEvent, render } from "@testing-library/react-native";
import { hapticLight } from "@/lib/haptics";
import { PolaroidCard } from "./PolaroidCard";

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

const baseColor = { hex: "#FF8040", nameEn: "Coral Pink" };

describe("PolaroidCard", () => {
	beforeEach(() => {
		(hapticLight as jest.Mock).mockClear();
	});

	it("empty variant renders swatch bg + `+` glyph + color name label", () => {
		const { getByTestId } = render(
			<PolaroidCard
				variant="empty"
				color={baseColor}
				rotation={0}
				testID="polaroid"
			/>,
		);
		expect(getByTestId("polaroid-plus").props.children).toBe("+");
		expect(getByTestId("polaroid-label").props.children).toBe("Coral Pink");
	});

	it("filled variant renders <Image> with imageUri + color name label (no `+`)", () => {
		const { getByTestId, queryByTestId } = render(
			<PolaroidCard
				variant="filled"
				color={baseColor}
				imageUri="file:///garment.png"
				rotation={0}
				testID="polaroid"
			/>,
		);
		expect(getByTestId("polaroid-image").props.source).toEqual({
			uri: "file:///garment.png",
		});
		expect(getByTestId("polaroid-label").props.children).toBe("Coral Pink");
		expect(queryByTestId("polaroid-plus")).toBeNull();
	});

	it("rotation prop is applied to the outer transform", () => {
		const { getByTestId } = render(
			<PolaroidCard
				variant="empty"
				color={baseColor}
				rotation={-2}
				testID="polaroid"
			/>,
		);
		const outer = getByTestId("polaroid");
		expect(outer.props.style).toMatchObject({
			transform: [{ rotate: "-2deg" }],
		});
	});

	it("onPress fires without the card firing haptics itself (parent controls haptics)", () => {
		const onPress = jest.fn();
		const { getByTestId } = render(
			<PolaroidCard
				variant="empty"
				color={baseColor}
				rotation={0}
				onPress={onPress}
				testID="polaroid"
			/>,
		);
		fireEvent.press(getByTestId("polaroid"));
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(hapticLight).not.toHaveBeenCalled();
	});

	it("accessibilityLabel passes through to the outer Pressable", () => {
		const { getByTestId } = render(
			<PolaroidCard
				variant="empty"
				color={baseColor}
				rotation={0}
				onPress={() => {}}
				accessibilityLabel="Placeholder for Coral Pink"
				testID="polaroid"
			/>,
		);
		expect(getByTestId("polaroid").props.accessibilityLabel).toBe(
			"Placeholder for Coral Pink",
		);
	});
});
