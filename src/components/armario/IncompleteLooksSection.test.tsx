import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Combination } from "@/data/types";
import type { CombinationAssignment } from "@/lib/wardrobeTypes";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, vars?: Record<string, unknown>) =>
			vars ? `${key}|${JSON.stringify(vars)}` : key,
	}),
}));

import { IncompleteLooksSection } from "./IncompleteLooksSection";

function makeCombo(id: string, colorCount = 3): Combination {
	const palette = ["#112233", "#445566", "#778899", "#aabbcc", "#ddeeff"];
	return {
		id,
		nameJp: `${id}-jp`,
		nameEn: `${id}-en`,
		colors: Array.from({ length: colorCount }, (_, i) => ({
			id: `${id}-c${i}`,
			hex: palette[i] ?? "#000000",
			nameJp: "色",
			nameEn: "Color",
			swatchGroup: 0 as const,
			combinationCount: 1,
		})),
	};
}

function makeAssignment(
	combinationId: string,
	colorIndex: number,
): CombinationAssignment {
	return {
		combinationId,
		colorIndex,
		wardrobeItemId: `${combinationId}-item-${colorIndex}`,
		assignedAt: 1,
	};
}

describe("IncompleteLooksSection", () => {
	it("returns null when incompleteLooks is empty", () => {
		render(
			<IncompleteLooksSection
				incompleteLooks={[]}
				assignments={[]}
				onTilePress={jest.fn()}
			/>,
		);
		expect(screen.queryByTestId("incomplete-looks-section")).toBeNull();
	});

	it("renders section header with correct i18n key + a11y role", () => {
		render(
			<IncompleteLooksSection
				incompleteLooks={[makeCombo("p001", 3)]}
				assignments={[]}
				onTilePress={jest.fn()}
			/>,
		);
		expect(screen.getByText("favorites.incompleteSection.title")).toBeTruthy();
		const header = screen.getByLabelText(
			"favorites.incompleteSection.a11yLabel",
		);
		expect(header.props.accessibilityRole).toBe("header");
	});

	it("renders one tile per incompleteLook", () => {
		render(
			<IncompleteLooksSection
				incompleteLooks={[
					makeCombo("p001", 3),
					makeCombo("p002", 2),
					makeCombo("p004", 4),
				]}
				assignments={[]}
				onTilePress={jest.fn()}
			/>,
		);
		const tiles = screen.getAllByTestId(/^incomplete-tile-p\d+$/);
		expect(tiles).toHaveLength(3);
	});

	it("tile tap calls onTilePress with combinationId", () => {
		const onTilePress = jest.fn();
		render(
			<IncompleteLooksSection
				incompleteLooks={[makeCombo("p001", 3)]}
				assignments={[]}
				onTilePress={onTilePress}
			/>,
		);
		fireEvent.press(screen.getByTestId("incomplete-tile-p001"));
		expect(onTilePress).toHaveBeenCalledTimes(1);
		expect(onTilePress).toHaveBeenCalledWith("p001");
	});

	it("tile renders mini color swatches matching combination.colors.length", () => {
		render(
			<IncompleteLooksSection
				incompleteLooks={[makeCombo("p004", 4)]}
				assignments={[]}
				onTilePress={jest.fn()}
			/>,
		);
		const swatches = screen.getAllByTestId(/^incomplete-tile-p004-swatch-\d+$/);
		expect(swatches).toHaveLength(4);
	});

	it("tile renders CompletenessBadge with correct assigned/total", () => {
		render(
			<IncompleteLooksSection
				incompleteLooks={[makeCombo("p001", 3)]}
				assignments={[makeAssignment("p001", 0), makeAssignment("p001", 1)]}
				onTilePress={jest.fn()}
			/>,
		);
		const badgeLabel = screen.getByTestId("incomplete-tile-p001-badge-label");
		// identity-t with interpolation serializes as `key|{"assigned":2,"total":3}`
		expect(badgeLabel.props.children).toContain('"assigned":2');
		expect(badgeLabel.props.children).toContain('"total":3');
	});

	it("tile a11y label includes name + assigned + total + remaining", () => {
		render(
			<IncompleteLooksSection
				incompleteLooks={[makeCombo("p001", 3)]}
				assignments={[makeAssignment("p001", 0)]}
				onTilePress={jest.fn()}
			/>,
		);
		const tile = screen.getByTestId("incomplete-tile-p001");
		const label = tile.props.accessibilityLabel as string;
		expect(label).toContain("favorites.incompleteTile.a11yLabel");
		expect(label).toContain('"name":"p001-en"');
		expect(label).toContain('"assigned":1');
		expect(label).toContain('"total":3');
		expect(label).toContain('"remaining":2');
		expect(tile.props.accessibilityHint).toBe(
			"favorites.incompleteTile.a11yHint",
		);
	});
});
