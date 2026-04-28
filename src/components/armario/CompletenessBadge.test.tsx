import { render } from "@testing-library/react-native";
import { COMPLETENESS_COLORS, CompletenessBadge } from "./CompletenessBadge";

describe("CompletenessBadge", () => {
	it("renders green complete variant with ✓ glyph and N/N text when assigned === total", () => {
		const { getByTestId, queryByTestId } = render(
			<CompletenessBadge assigned={3} total={3} testID="badge" />,
		);
		const container = getByTestId("badge");
		const glyph = getByTestId("badge-glyph");
		const label = getByTestId("badge-label");
		expect(container.props.style).toMatchObject({
			backgroundColor: COMPLETENESS_COLORS.complete.bg,
		});
		expect(glyph.props.children).toBe("✓");
		expect(glyph.props.style).toMatchObject({
			color: COMPLETENESS_COLORS.complete.fg,
		});
		expect(label.props.children).toBe("3/3");
		expect(container.props.accessibilityLabel).toBe("3 of 3 assigned");
		// Sanity: partial/none variants don't leak.
		expect(queryByTestId("badge-glyph")).not.toBeNull();
	});

	it("renders amber partial variant without ✓ glyph when 0 < assigned < total", () => {
		const { getByTestId, queryByTestId } = render(
			<CompletenessBadge assigned={2} total={3} testID="badge" />,
		);
		const container = getByTestId("badge");
		const label = getByTestId("badge-label");
		expect(container.props.style).toMatchObject({
			backgroundColor: COMPLETENESS_COLORS.partial.bg,
		});
		expect(label.props.children).toBe("2/3");
		expect(label.props.style).toMatchObject({
			color: COMPLETENESS_COLORS.partial.fg,
		});
		expect(queryByTestId("badge-glyph")).toBeNull();
		expect(container.props.accessibilityLabel).toBe("2 of 3 assigned");
	});

	it("renders grey none variant with 'No garments' when assigned is 0", () => {
		const { getByTestId } = render(
			<CompletenessBadge assigned={0} total={3} testID="badge" />,
		);
		const container = getByTestId("badge");
		const label = getByTestId("badge-label");
		expect(container.props.style).toMatchObject({
			backgroundColor: COMPLETENESS_COLORS.none.bg,
		});
		expect(label.props.children).toBe("No garments");
	});

	it("variant='long' + complete 3/3 → renders '3/3 garments' via armario.favorites.badgeComplete", () => {
		const { getByTestId } = render(
			<CompletenessBadge
				assigned={3}
				total={3}
				variant="long"
				testID="badge"
			/>,
		);
		expect(getByTestId("badge-label").props.children).toBe("3/3 garments");
	});

	it("variant='long' + partial 2/3 → '2/3 garments'", () => {
		const { getByTestId } = render(
			<CompletenessBadge
				assigned={2}
				total={3}
				variant="long"
				testID="badge"
			/>,
		);
		expect(getByTestId("badge-label").props.children).toBe("2/3 garments");
	});

	it("variant='long' + none → renders 'No garments' via armario.favorites.badgeNone", () => {
		const { getByTestId } = render(
			<CompletenessBadge
				assigned={0}
				total={3}
				variant="long"
				testID="badge"
			/>,
		);
		expect(getByTestId("badge-label").props.children).toBe("No garments");
	});

	it("defensively renders grey none variant when total is 0", () => {
		const { getByTestId } = render(
			<CompletenessBadge assigned={0} total={0} testID="badge" />,
		);
		const container = getByTestId("badge");
		const label = getByTestId("badge-label");
		expect(container.props.style).toMatchObject({
			backgroundColor: COMPLETENESS_COLORS.none.bg,
		});
		expect(label.props.children).toBe("No garments");
	});
});
