import { render } from "@testing-library/react-native";
import { WadaColorDot } from "./WadaColorDot";

describe("WadaColorDot", () => {
	it("renders with the default size (12pt) and the supplied hex background", () => {
		const { getByTestId } = render(<WadaColorDot hex="#FF8040" testID="dot" />);
		const dot = getByTestId("dot", { includeHiddenElements: true });
		expect(dot.props.style).toMatchObject({
			width: 12,
			height: 12,
			borderRadius: 6,
			backgroundColor: "#FF8040",
		});
	});

	it("honors a custom size prop", () => {
		const { getByTestId } = render(
			<WadaColorDot hex="#112233" size={24} testID="dot" />,
		);
		const dot = getByTestId("dot", { includeHiddenElements: true });
		expect(dot.props.style).toMatchObject({
			width: 24,
			height: 24,
			borderRadius: 12,
			backgroundColor: "#112233",
		});
	});
});
