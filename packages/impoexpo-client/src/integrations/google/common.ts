import { useAuthStore } from "@/stores/auth";
import {
	GOOGLE_ACCESS_TOKEN_HEADER_NAME,
	GOOGLE_EXPIRY_TIMESTAMP_HEADER_NAME,
	GOOGLE_REFRESH_TOKEN_HEADER_NAME,
} from "@impoexpo/shared";

export const GOOGLE_AUTH_KEY = "google_auth";
export const GOOGLE_EXCHANGE_ROUTE = "/integration/google/exchange";

export const checkGoogleAuthentication = async () => {
	if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
		throw new Error(
			"couldn't locate google client ID in environment variables",
		);
	}

	useAuthStore.getState().load();
	return useAuthStore.getState().google !== undefined;
};

export const getGoogleAuthHeaders = (): Record<string, string> => {
	const state = useAuthStore.getState().google;
	if (state === undefined)
		throw new Error(
			"can't get google auth headers without auth data in localStorage!",
		);
	return {
		[GOOGLE_ACCESS_TOKEN_HEADER_NAME]: state.accessToken,
		[GOOGLE_REFRESH_TOKEN_HEADER_NAME]: state.refreshToken,
		[GOOGLE_EXPIRY_TIMESTAMP_HEADER_NAME]: state.expiryTimestamp.toString(),
	};
};
