import { useAuthStore } from "@/stores/auth";

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
