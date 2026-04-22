import { fireEvent, render, screen } from "@testing-library/react-native";
import type { WardrobeCategory } from "@/lib/wardrobeTypes";

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

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

import { hapticLight, hapticMedium } from "@/lib/haptics";
import { CategoryPickerSheet } from "./CategoryPickerSheet";

function renderSheet(
	overrides: Partial<React.ComponentProps<typeof CategoryPickerSheet>> = {},
) {
	const onConfirm = jest.fn();
	const onCancel = jest.fn();
	const props: React.ComponentProps<typeof CategoryPickerSheet> = {
		visible: true,
		onConfirm,
		onCancel,
		...overrides,
	};
	const utils = render(<CategoryPickerSheet {...props} />);
	return { onConfirm, onCancel, ...utils };
}

describe("CategoryPickerSheet", () => {
	beforeEach(() => {
		(hapticLight as jest.Mock).mockClear();
		(hapticMedium as jest.Mock).mockClear();
	});

	it("renders the 4 category rows with localized labels and icons", () => {
		renderSheet();
		expect(screen.getByTestId("category-picker-sheet-title")).toHaveTextContent(
			"unifiedCamera.categorySheet.title",
		);
		expect(screen.getByTestId("category-picker-row-top")).toBeTruthy();
		expect(screen.getByTestId("category-picker-row-bottom")).toBeTruthy();
		expect(screen.getByTestId("category-picker-row-footwear")).toBeTruthy();
		expect(screen.getByTestId("category-picker-row-accessory")).toBeTruthy();
		// Icons rendered via the SymbolView mock.
		expect(screen.getByTestId("symbol-tshirt.fill")).toBeTruthy();
		expect(screen.getByTestId("symbol-figure.stand")).toBeTruthy();
		expect(screen.getByTestId("symbol-shoe.fill")).toBeTruthy();
		expect(screen.getByTestId("symbol-eyeglasses")).toBeTruthy();
	});

	it("Confirmar is disabled when nothing is selected", () => {
		const { onConfirm } = renderSheet();
		const confirm = screen.getByTestId("category-picker-sheet-confirm");
		expect(confirm.props.accessibilityState.disabled).toBe(true);
		fireEvent.press(confirm);
		expect(onConfirm).not.toHaveBeenCalled();
		expect(hapticMedium).not.toHaveBeenCalled();
	});

	it("row tap fires hapticLight, selects the row, and does not auto-confirm", () => {
		const { onConfirm } = renderSheet();
		fireEvent.press(screen.getByTestId("category-picker-row-bottom"));
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(onConfirm).not.toHaveBeenCalled();
		const row = screen.getByTestId("category-picker-row-bottom");
		expect(row.props.accessibilityState.selected).toBe(true);
		// Checkmark visible on selected row only.
		expect(screen.getByTestId("category-picker-row-bottom-check")).toBeTruthy();
		expect(screen.queryByTestId("category-picker-row-top-check")).toBeNull();
	});

	it("Confirmar tap with a selection fires hapticMedium and onConfirm(category)", () => {
		const { onConfirm } = renderSheet();
		fireEvent.press(screen.getByTestId("category-picker-row-footwear"));
		fireEvent.press(screen.getByTestId("category-picker-sheet-confirm"));
		expect(hapticMedium).toHaveBeenCalledTimes(1);
		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(onConfirm).toHaveBeenCalledWith("footwear");
	});

	it("backdrop tap fires onCancel", () => {
		const { onCancel } = renderSheet();
		fireEvent.press(screen.getByTestId("category-picker-sheet-backdrop"));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it("currentCategory prop pre-selects the matching row", () => {
		const current: WardrobeCategory = "accessory";
		renderSheet({ currentCategory: current });
		expect(
			screen.getByTestId("category-picker-row-accessory").props
				.accessibilityState.selected,
		).toBe(true);
		// Confirmar already enabled.
		expect(
			screen.getByTestId("category-picker-sheet-confirm").props
				.accessibilityState.disabled,
		).toBe(false);
	});

	it("confirming prop disables Confirmar and shows the ActivityIndicator", () => {
		const { onConfirm } = renderSheet({
			currentCategory: "top",
			confirming: true,
		});
		const confirm = screen.getByTestId("category-picker-sheet-confirm");
		expect(confirm.props.accessibilityState.disabled).toBe(true);
		expect(confirm.props.accessibilityState.busy).toBe(true);
		expect(
			screen.getByTestId("category-picker-sheet-confirm-spinner"),
		).toBeTruthy();
		fireEvent.press(confirm);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it("reopening the sheet with a different currentCategory resets the selection", () => {
		const { rerender } = renderSheet({ visible: false });
		rerender(
			<CategoryPickerSheet
				visible={true}
				currentCategory="bottom"
				onConfirm={jest.fn()}
				onCancel={jest.fn()}
			/>,
		);
		expect(
			screen.getByTestId("category-picker-row-bottom").props.accessibilityState
				.selected,
		).toBe(true);
	});
});
