import { Component, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo): void {
		if (__DEV__) {
			console.error("ErrorBoundary caught:", error, info);
		}
	}

	render() {
		if (this.state.hasError) {
			return (
				<SafeAreaView className="flex-1 bg-paper">
					<View
						className="flex-1 items-center justify-center px-6"
						accessibilityLabel="Application error screen"
						accessibilityRole="alert"
					>
						<Text
							allowFontScaling
							className="font-serif-jp-medium text-[20px] text-text-primary"
							accessibilityRole="header"
						>
							Outfinder
						</Text>
						<Text
							allowFontScaling
							className="font-sans text-[14px] text-text-secondary mt-3"
						>
							Something went wrong
						</Text>
						<Pressable
							testID="error-boundary-restart"
							className="min-h-[48px] rounded-full bg-text-primary px-8 mt-6 items-center justify-center"
							accessibilityRole="button"
							accessibilityLabel="Restart"
							onPress={() => this.setState({ hasError: false })}
						>
							<Text
								allowFontScaling
								className="font-sans text-[14px] text-paper font-medium"
							>
								Restart
							</Text>
						</Pressable>
					</View>
				</SafeAreaView>
			);
		}

		return this.props.children;
	}
}
