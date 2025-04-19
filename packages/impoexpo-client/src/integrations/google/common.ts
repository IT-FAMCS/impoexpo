import { getAuthFromDatabase } from "@/db/auth";
import { GoogleExchangeResponseSchema } from "@impoexpo/shared/schemas/integrations/google/GoogleExchangeResponseSchema";
import { GOOGLE_ACCESS_TOKENS_HEADER_NAME } from "@impoexpo/shared/schemas/integrations/google/static";

export const GOOGLE_AUTH_KEY = "google_auth";

export const checkGoogleAuthentication = async () => {
	if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
		throw new Error(
			"couldn't locate google client ID in environment variables",
		);
	}
	return (
		(await getAuthFromDatabase("google", GoogleExchangeResponseSchema)) !==
		undefined
	);
};

export const getGoogleAuthHeaders = async (): Promise<
	Record<string, string>
> => {
	const auth = await getAuthFromDatabase(
		"google",
		GoogleExchangeResponseSchema,
	);
	if (!auth)
		throw new Error(
			"can't get google auth headers without auth data in the database!",
		);
	return {
		[GOOGLE_ACCESS_TOKENS_HEADER_NAME]: auth.tokens,
	};
};
