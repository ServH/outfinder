import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

const STORAGE_KEY = "@outfinder/favorites";

interface FavoritesContextValue {
	favorites: Set<string>;
	isFavorite: (id: string) => boolean;
	toggleFavorite: (id: string) => void;
	count: number;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export interface FavoritesProviderProps {
	children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
	const [favorites, setFavorites] = useState<Set<string>>(new Set());

	useEffect(() => {
		AsyncStorage.getItem(STORAGE_KEY)
			.then((stored) => {
				if (stored) {
					const parsed: unknown = JSON.parse(stored);
					if (
						Array.isArray(parsed) &&
						parsed.every((v) => typeof v === "string")
					) {
						setFavorites(new Set(parsed as string[]));
					}
				}
			})
			.catch((error) => {
				if (__DEV__) {
					console.error("Failed to load favorites:", error);
				}
			});
	}, []);

	const isFavorite = useCallback(
		(id: string) => favorites.has(id),
		[favorites],
	);

	const toggleFavorite = useCallback((id: string) => {
		setFavorites((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(
				(error) => {
					if (__DEV__) {
						console.error("Failed to persist favorites:", error);
					}
				},
			);
			return next;
		});
	}, []);

	const count = favorites.size;

	const value = useMemo(
		() => ({ favorites, isFavorite, toggleFavorite, count }),
		[favorites, isFavorite, toggleFavorite, count],
	);

	return (
		<FavoritesContext.Provider value={value}>
			{children}
		</FavoritesContext.Provider>
	);
}

export function useFavorites(): FavoritesContextValue {
	const context = useContext(FavoritesContext);
	if (!context) {
		throw new Error("useFavorites must be used within a FavoritesProvider");
	}
	return context;
}
