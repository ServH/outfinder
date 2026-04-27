import { useNavigation, useRoute } from "@react-navigation/native";
import type {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { File } from "expo-file-system";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AccessibilityInfo,
	ActivityIndicator,
	Image,
	Pressable,
	Text,
	View,
} from "react-native";
import { CategoryPickerSheet } from "@/components/armario/CategoryPickerSheet";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { usePremium } from "@/contexts/PremiumContext";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { saveCutoutAsWardrobeItem } from "@/lib/armario/saveCutoutAsWardrobeItem";
import { WardrobePersistenceError } from "@/lib/armario/wardrobeErrors";
import { hapticLight, hapticMedium, hapticRigid } from "@/lib/haptics";
import type { WardrobeCategory } from "@/lib/wardrobeTypes";
import type { ArmarioStackParamList } from "@/navigation/types";
import { useMisLooksStore } from "@/stores/misLooksStore";
import { wadaTokens } from "@/styles/theme";

type ArmarioPreviewRoute = NativeStackScreenProps<
	ArmarioStackParamList,
	"ArmarioPreview"
>["route"];

type ArmarioPreviewNav = NativeStackNavigationProp<
	ArmarioStackParamList,
	"ArmarioPreview"
>;

type ArmarioPreviewScreenProps = Record<string, never>;

function deleteCutoutTmp(cutoutUri: string): void {
	// Fire-and-forget — the tmp directory is swept by iOS periodically so a
	// missed delete is not user-visible. Double-deletes are no-ops under the
	// SDK 55 class-based API (throws a FileSystemError the catch absorbs).
	try {
		new File(cutoutUri).delete();
	} catch (error) {
		if (__DEV__) {
			console.warn(
				"[ArmarioPreviewScreen] failed to delete cutout tmp:",
				error,
			);
		}
	}
}

export function ArmarioPreviewScreen(_props: ArmarioPreviewScreenProps) {
	const { t } = useTranslation();
	const navigation = useNavigation<ArmarioPreviewNav>();
	const route = useRoute<ArmarioPreviewRoute>();
	const { cutoutUri, sourceUri, onCutoutSaved } = route.params;
	const { isPremium } = usePremium();
	const favorites = useMisLooksStore((s) => s.favorites);
	const wardrobeItems = useMisLooksStore((s) => s.items);
	const wardrobeItemCount = wardrobeItems.length;
	const wardrobeItemThumbnails = useMemo(
		() =>
			wardrobeItems
				.slice(-5)
				.reverse()
				.map((i) => i.thumbnailPath),
		[wardrobeItems],
	);
	const gate = usePremiumGate(favorites);

	const [submitting, setSubmitting] = useState(false);
	const [paywallVisible, setPaywallVisible] = useState(false);
	const [errorCopy, setErrorCopy] = useState<string | null>(null);
	const [categorySheetVisible, setCategorySheetVisible] = useState(false);
	const isMounted = useRef(true);
	// Stash the user-selected category across a paywall round-trip. On a
	// successful purchase, the aftermath effect re-invokes the save with this
	// same category so the user is not asked to pick twice.
	const pendingCategoryRef = useRef<WardrobeCategory | null>(null);

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	// Announce the cutout-ready signal even if VoiceOver focus is elsewhere
	// after navigation (accessibilityLiveRegion on a static Image would only
	// fire on focus).
	useEffect(() => {
		AccessibilityInfo.announceForAccessibility(
			t("armario.preview.cutoutReady"),
		);
	}, [t]);

	const handleRetake = useCallback(() => {
		hapticLight();
		deleteCutoutTmp(cutoutUri);
		navigation.goBack();
	}, [cutoutUri, navigation]);

	const handleUse = useCallback(() => {
		if (submitting || categorySheetVisible) return;
		hapticMedium();
		setCategorySheetVisible(true);
	}, [submitting, categorySheetVisible]);

	const handleSheetCancel = useCallback(() => {
		setCategorySheetVisible(false);
		pendingCategoryRef.current = null;
	}, []);

	const handleCategoryConfirm = useCallback(
		async (category: WardrobeCategory) => {
			pendingCategoryRef.current = category;
			setSubmitting(true);
			try {
				const result = await saveCutoutAsWardrobeItem({
					cutoutUri,
					sourceUri,
					isPremium,
					category,
				});
				if (!isMounted.current) return;
				hapticRigid();
				pendingCategoryRef.current = null;
				setCategorySheetVisible(false);
				setSubmitting(false);
				// Invoke callback BEFORE dismissing so the caller's state lands
				// before Preview unmounts. Safe to omit — callback is optional.
				onCutoutSaved?.(result.id);
				if (onCutoutSaved) {
					// Dismiss the ArmarioRoot modal entirely so the user lands back
					// on the picker. Fall back to local goBack if the parent is
					// unavailable (deep-link or isolated test harness).
					const parent = navigation.getParent();
					if (parent) {
						parent.goBack();
					} else {
						navigation.goBack();
					}
				} else {
					navigation.goBack();
				}
			} catch (e) {
				if (!isMounted.current) return;
				setSubmitting(false);
				if (e instanceof WardrobePersistenceError) {
					if (e.kind === "paywall") {
						// Hide sheet behind paywall; KEEP pendingCategoryRef set so
						// the aftermath effect can silently retry on isPremium=true.
						setCategorySheetVisible(false);
						setPaywallVisible(true);
						return;
					}
					setCategorySheetVisible(false);
					pendingCategoryRef.current = null;
					if (e.kind === "diskFull") {
						setErrorCopy(t("armario.preview.errorDiskFull"));
						return;
					}
					if (e.kind === "encode") {
						setErrorCopy(t("armario.preview.errorEncode"));
						return;
					}
					if (e.kind === "move" || e.kind === "repoAdd") {
						setErrorCopy(t("armario.preview.errorSaveFailed"));
						return;
					}
					// Catch-all for future WardrobePersistenceError kinds.
					setErrorCopy(t("armario.preview.errorSaveFailed"));
					return;
				}
				if (__DEV__) {
					console.warn("[ArmarioPreviewScreen] save failed:", e);
				}
				setCategorySheetVisible(false);
				pendingCategoryRef.current = null;
				setErrorCopy(t("armario.preview.errorSaveFailed"));
			}
		},
		[cutoutUri, sourceUri, isPremium, navigation, onCutoutSaved, t],
	);

	// Paywall aftermath: when the paywall closes and the save flow is idle,
	//   - isPremium=true + pending ref → silent retry with the original
	//     selection (purchase succeeded; user shouldn't pick twice).
	//   - isPremium=false → clear the ref so a future isPremium flip outside
	//     this flow cannot silently re-trigger a stale save.
	// The ref is cleared BEFORE the re-call to guard against reentry.
	useEffect(() => {
		if (paywallVisible || submitting) return;
		if (isPremium && pendingCategoryRef.current !== null) {
			const cat = pendingCategoryRef.current;
			pendingCategoryRef.current = null;
			void handleCategoryConfirm(cat);
			return;
		}
		if (!isPremium) {
			pendingCategoryRef.current = null;
		}
	}, [isPremium, paywallVisible, submitting, handleCategoryConfirm]);

	const handleErrorDismiss = useCallback(() => {
		if (!isMounted.current) return;
		setErrorCopy(null);
	}, []);

	const handlePaywallDismiss = useCallback(() => {
		if (!isMounted.current) return;
		setPaywallVisible(false);
		gate.handleDismiss();
		// Only delete the tmp when no aftermath retry is pending. If the user
		// purchased premium, pendingCategoryRef holds the category for the silent
		// re-save; deleting the file here would cause that retry to fail with a
		// file-not-found error. The dismiss-without-purchase path clears the ref
		// via the aftermath effect's !isPremium branch.
		if (pendingCategoryRef.current === null) {
			deleteCutoutTmp(cutoutUri);
		}
	}, [cutoutUri, gate]);

	const handlePurchase = useCallback(() => {
		// `handlePurchase` takes a `toggleFavorite` arg — no-op here since there
		// is no combination to unlock on successful purchase.
		gate.handlePurchase(() => {});
	}, [gate]);

	return (
		<View
			className="flex-1"
			style={{ backgroundColor: wadaTokens.bgPaper }}
			testID="armario-preview-screen"
		>
			{/* Back chevron — equivalent to Retake (also deletes the tmp cutout). */}
			<Pressable
				onPress={handleRetake}
				accessibilityRole="button"
				accessibilityLabel={t("armario.capture.goBack")}
				className="absolute items-center justify-center"
				style={{ top: 56, left: 20, width: 48, height: 48, zIndex: 1 }}
				testID="armario-preview-back-button"
				disabled={submitting}
				accessibilityState={{ disabled: submitting }}
			>
				{({ pressed }) => (
					<View
						className="flex-1 items-center justify-center"
						style={{ opacity: pressed ? 0.7 : submitting ? 0.5 : 1 }}
					>
						<SymbolView
							name="chevron.left"
							size={22}
							tintColor={wadaTokens.textPrimary}
						/>
					</View>
				)}
			</Pressable>

			{/* Cutout preview — leaves ~140pt for the CTAs at the bottom. */}
			<View
				className="flex-1 items-center justify-center px-4"
				style={{ paddingTop: 96, paddingBottom: 140 }}
			>
				<Image
					source={{ uri: cutoutUri }}
					resizeMode="contain"
					style={{ flex: 1, width: "100%" }}
					accessibilityLabel={t("armario.preview.imageLabel")}
					accessibilityRole="image"
					testID="armario-preview-image"
				/>
			</View>

			{/* CTAs row */}
			<View
				className="absolute left-0 right-0 flex-row gap-3 px-4"
				style={{ bottom: 32 }}
			>
				<Pressable
					onPress={handleRetake}
					accessibilityRole="button"
					accessibilityLabel={t("armario.preview.retakeButton")}
					className="flex-1 min-h-[44px] items-center justify-center rounded-[14px] py-4"
					style={{
						backgroundColor: wadaTokens.bgElevated,
						opacity: submitting ? 0.6 : 1,
					}}
					testID="armario-preview-retake-button"
					disabled={submitting}
					accessibilityState={{ disabled: submitting }}
				>
					{({ pressed }) => (
						<Text
							style={{
								fontFamily: "Inter_500Medium",
								fontSize: 15,
								color: wadaTokens.textPrimary,
								opacity: pressed ? 0.7 : 1,
							}}
						>
							{t("armario.preview.retakeButton")}
						</Text>
					)}
				</Pressable>

				<Pressable
					onPress={handleUse}
					accessibilityRole="button"
					accessibilityLabel={t("armario.preview.useButton")}
					className="flex-1 min-h-[44px] items-center justify-center rounded-[14px] py-4"
					style={{
						backgroundColor: wadaTokens.textPrimary,
						opacity: submitting ? 0.6 : 1,
					}}
					testID="armario-preview-use-button"
					disabled={submitting}
					accessibilityState={{ disabled: submitting, busy: submitting }}
				>
					{({ pressed }) =>
						submitting ? (
							<ActivityIndicator
								testID="armario-preview-use-button-spinner"
								size="small"
								color={wadaTokens.bgPaper}
							/>
						) : (
							<Text
								style={{
									fontFamily: "Inter_500Medium",
									fontSize: 15,
									color: wadaTokens.bgPaper,
									letterSpacing: 0.3,
									opacity: pressed ? 0.7 : 1,
								}}
							>
								{t("armario.preview.useButton")}
							</Text>
						)
					}
				</Pressable>
			</View>

			{errorCopy !== null && (
				<View
					testID="armario-preview-error-sheet"
					accessibilityRole="alert"
					accessibilityLiveRegion="assertive"
					className="absolute left-4 right-4 rounded-[14px]"
					style={{
						bottom: 200,
						backgroundColor: "rgba(0,0,0,0.82)",
						paddingHorizontal: 16,
						paddingVertical: 16,
					}}
				>
					<Text
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 14,
							color: "white",
							textAlign: "center",
							lineHeight: 20,
						}}
					>
						{errorCopy}
					</Text>
					<View className="flex-row justify-center mt-3">
						<Pressable
							testID="armario-preview-error-dismiss-button"
							onPress={handleErrorDismiss}
							accessibilityRole="button"
							accessibilityLabel={t("armario.preview.errorDismiss")}
							className="min-h-[44px] min-w-[44px] items-center justify-center px-4"
						>
							<Text
								style={{
									fontFamily: "Inter_500Medium",
									fontSize: 14,
									color: "white",
								}}
							>
								{t("armario.preview.errorDismiss")}
							</Text>
						</Pressable>
					</View>
				</View>
			)}

			<CategoryPickerSheet
				visible={categorySheetVisible}
				onConfirm={handleCategoryConfirm}
				onCancel={handleSheetCancel}
				confirming={submitting}
			/>

			<PremiumPaywall
				visible={paywallVisible}
				context="wardrobe"
				currentCount={wardrobeItemCount}
				wardrobeItemThumbnails={wardrobeItemThumbnails}
				priceString={gate.priceString}
				purchaseState={gate.purchaseState}
				errorMessage={gate.errorMessage}
				onPurchase={handlePurchase}
				onRestore={gate.handleRestore}
				onDismiss={handlePaywallDismiss}
			/>
		</View>
	);
}
