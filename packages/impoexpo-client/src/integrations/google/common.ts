import { useAuthStore } from "@/stores/auth";
import { GOOGLE_ACCESS_TOKENS_HEADER_NAME } from "@impoexpo/shared/schemas/integrations/google/static";

export const GOOGLE_AUTH_KEY = "google_auth";

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
		[GOOGLE_ACCESS_TOKENS_HEADER_NAME]: state.tokens,
	};
};
