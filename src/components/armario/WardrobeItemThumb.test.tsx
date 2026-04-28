import { render } from "@testing-library/react-native";
import { WardrobeItemThumb } from "./WardrobeItemThumb";

describe("WardrobeItemThumb", () => {
	it("renders an Image whose source.uri matches the prop", () => {
		const { getByTestId } = render(
			<WardrobeItemThumb uri="file:///garment.png" testID="thumb" />,
		);
		const image = getByTestId("thumb-image", { includeHiddenElements: true });
		expect(image.props.source).toEqual({ uri: "file:///garment.png" });
	});

	it("honors a custom size prop on both the wrapper and the Image", () => {
		const { getByTestId } = render(
			<WardrobeItemThumb uri="file:///garment.png" size={140} testID="thumb" />,
		);
		const wrapper = getByTestId("thumb", { includeHiddenElements: true });
		const image = getByTestId("thumb-image", { includeHiddenElements: true });
		expect(wrapper.props.style).toMatchObject({ width: 140, height: 140 });
		expect(image.props.style).toMatchObject({ width: 140, height: 140 });
	});

	it("exposes the accessibilityLabel when provided and hides from a11y otherwise", () => {
		const { getByTestId, rerender } = render(
			<WardrobeItemThumb
				uri="file:///garment.png"
				accessibilityLabel="Red T-shirt"
				testID="thumb"
			/>,
		);
		let wrapper = getByTestId("thumb");
		expect(wrapper.props.accessibilityLabel).toBe("Red T-shirt");
		expect(wrapper.props.accessibilityElementsHidden).toBe(false);

		rerender(<WardrobeItemThumb uri="file:///garment.png" testID="thumb" />);
		wrapper = getByTestId("thumb", { includeHiddenElements: true });
		expect(wrapper.props.accessibilityElementsHidden).toBe(true);
	});
});
