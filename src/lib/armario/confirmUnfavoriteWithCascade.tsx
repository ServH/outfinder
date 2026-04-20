import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { isIOS17OrNewer } from "@/lib/platform";
import { cascadeDeleteAssignmentsForCombination } from "@/lib/wardrobeRepo";
import { wadaTokens } from "@/styles/theme";

interface ShowConfirmArgs {
	combinationId: string;
	count: number;
	onConfirm: () => void;
	onCancel?: () => void;
}

type UnfavoriteCascadeContextValue = (args: ShowConfirmArgs) => void;

const UnfavoriteCascadeContext =
	createContext<UnfavoriteCascadeContextValue | null>(null);

interface UnfavoriteCascadeProviderProps {
	children: ReactNode;
}

interface PendingConfirm {
	combinationId: string;
	count: number;
	onConfirm: () => void;
	onCancel?: () => void;
}

export function UnfavoriteCascadeProvider({
	children,
}: UnfavoriteCascadeProviderProps) {
	const { t } = useTranslation();
	const reducedMotion = useReducedMotion();
	const [pending, setPending] = useState<PendingConfirm | null>(null);
	const isSubmitting = useRef(false);

	const showConfirm = useCallback((args: ShowConfirmArgs) => {
		// iOS < 17 OR zero assignments → NFR9 parity: skip the confirmation and
		// let the caller's unfavorite proceed immediately. This keeps the
		// Colors-tab Combinations unfavorite flow identical to pre-Epic-13.
		if (!isIOS17OrNewer() || args.count === 0) {
			args.onConfirm();
			return;
		}
		isSubmitting.current = false;
		setPending({
			combinationId: args.combinationId,
			count: args.count,
			onConfirm: args.onConfirm,
			onCancel: args.onCancel,
		});
	}, []);

	const handleConfirm = useCallback(() => {
		if (!pending || isSubmitting.current) return;
		isSubmitting.current = true;
		try {
			cascadeDeleteAssignmentsForCombination(pending.combinationId);
		} catch (err) {
			if (__DEV__) {
				console.warn("[UnfavoriteCascadeProvider] cascade delete failed", err);
			}
			isSubmitting.current = false;
			setPending(null);
			return;
		}
		pending.onConfirm();
		setPending(null);
	}, [pending]);

	const handleCancel = useCallback(() => {
		if (!pending) return;
		pending.onCancel?.();
		setPending(null);
	}, [pending]);

	// Keep the context value stable across renders — `showConfirm` already has
	// a stable identity (no deps), but memoizing here documents intent for any
	// future deps that might creep in.
	const contextValue = useMemo<UnfavoriteCascadeContextValue>(
		() => showConfirm,
		[showConfirm],
	);

	return (
		<UnfavoriteCascadeContext.Provider value={contextValue}>
			{children}
			<Modal
				testID="armario-unfavorite-cascade-sheet"
				transparent
				visible={pending !== null}
				animationType={reducedMotion ? "none" : "fade"}
				onRequestClose={handleCancel}
				statusBarTranslucent
			>
				<View
					className="flex-1 items-center justify-end"
					style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
				>
					<Pressable
						testID="armario-unfavorite-cascade-scrim"
						accessibilityRole="button"
						accessibilityLabel={t("common.cancel")}
						onPress={handleCancel}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
						}}
					/>
					<View
						accessibilityViewIsModal
						style={{
							backgroundColor: wadaTokens.bgPaper,
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							paddingHorizontal: 24,
							paddingTop: 20,
							paddingBottom: 36,
							width: "100%",
						}}
					>
						{pending !== null && (
							<>
								<Text
									testID="armario-unfavorite-cascade-body"
									style={{
										fontFamily: "Inter_400Regular",
										fontSize: 15,
										color: wadaTokens.textPrimary,
										textAlign: "center",
										lineHeight: 22,
									}}
								>
									{t("armario.unfavoriteCascade.body", {
										count: pending.count,
									})}
								</Text>
								<Pressable
									testID="armario-unfavorite-cascade-confirm"
									onPress={handleConfirm}
									accessibilityRole="button"
									accessibilityLabel={t("armario.unfavoriteCascade.confirm")}
									className="items-center justify-center"
									style={{
										marginTop: 24,
										minHeight: 44,
										paddingVertical: 14,
										borderRadius: 14,
										backgroundColor: wadaTokens.favoriteRed,
									}}
								>
									<Text
										style={{
											fontFamily: "Inter_500Medium",
											fontSize: 15,
											color: "#ffffff",
										}}
									>
										{t("armario.unfavoriteCascade.confirm")}
									</Text>
								</Pressable>
								<Pressable
									testID="armario-unfavorite-cascade-cancel"
									onPress={handleCancel}
									accessibilityRole="button"
									accessibilityLabel={t("common.cancel")}
									className="items-center justify-center"
									style={{
										marginTop: 8,
										minHeight: 44,
									}}
								>
									<Text
										style={{
											fontFamily: "Inter_400Regular",
											fontSize: 14,
											color: wadaTokens.textSecondary,
										}}
									>
										{t("common.cancel")}
									</Text>
								</Pressable>
							</>
						)}
					</View>
				</View>
			</Modal>
		</UnfavoriteCascadeContext.Provider>
	);
}

export function useUnfavoriteCascade(): UnfavoriteCascadeContextValue {
	const ctx = useContext(UnfavoriteCascadeContext);
	if (!ctx) {
		// No-op fallback preserves NFR9 parity for any surface rendered
		// outside the provider (e.g. isolated component tests). Behaves like
		// iOS < 17: skip the confirmation and fire onConfirm directly.
		return (args) => {
			args.onConfirm();
		};
	}
	return ctx;
}
