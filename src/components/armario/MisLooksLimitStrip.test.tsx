import { act, render } from "@testing-library/react-native";
import { i18n } from "@/i18n";
import { MisLooksLimitStrip } from "./MisLooksLimitStrip";

describe("MisLooksLimitStrip", () => {
	afterEach(async () => {
		await act(async () => {
			await i18n.changeLanguage("en");
		});
	});

	it("renders with testID=mislooks-limit-strip", () => {
		const { getByTestId } = render(<MisLooksLimitStrip />);
		expect(getByTestId("mislooks-limit-strip")).toBeTruthy();
	});

	it("renders the ES copy when locale=es", async () => {
		await act(async () => {
			await i18n.changeLanguage("es");
		});
		const { getByTestId } = render(<MisLooksLimitStrip />);
		const strip = getByTestId("mislooks-limit-strip");
		expect(strip.props.accessibilityLabel).toContain("Aviso");
		expect(strip).toHaveTextContent(
			"Alcanzaste el límite de 5 looks guardados. Elimina uno para continuar.",
		);
	});

	it("renders the EN copy when locale=en", async () => {
		await act(async () => {
			await i18n.changeLanguage("en");
		});
		const { getByTestId } = render(<MisLooksLimitStrip />);
		const strip = getByTestId("mislooks-limit-strip");
		expect(strip.props.accessibilityLabel).toContain("Alert");
		expect(strip).toHaveTextContent(
			"You've reached the 5 saved-looks limit. Delete one to continue.",
		);
	});

	it("has accessibilityRole='alert' and accessibilityLabel wired", () => {
		const { getByTestId } = render(<MisLooksLimitStrip />);
		const strip = getByTestId("mislooks-limit-strip");
		expect(strip.props.accessibilityRole).toBe("alert");
		expect(typeof strip.props.accessibilityLabel).toBe("string");
		expect(strip.props.accessibilityLabel.length).toBeGreaterThan(0);
	});
});
