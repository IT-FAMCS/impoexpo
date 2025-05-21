import { getWithSchema } from "@/api/common";
import { getAuthFromDatabase, saveAuthToDatabase } from "@/db/auth";
import {
	GOOGLE_REFRESH_ROUTE,
	GOOGLE_ACCESS_TOKENS_HEADER_NAME,
} from "@impoexpo/shared/schemas/integrations/google/static";
import { GoogleExchangeResponseSchema } from "@impoexpo/shared/schemas/integrations/google/GoogleExchangeResponseSchema";
import { GoogleRefreshResponseSchema } from "@impoexpo/shared/schemas/integrations/google/GoogleRefreshResponseSchema";

export const GOOGLE_AUTH_KEY = "google_auth";

export const checkGoogleAuthentication = async () => {
	if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
		throw new Error(
			"couldn't locate google client ID in environment variables",
		);
	}

	const previousAuth = await getAuthFromDatabase(
		"google",
		GoogleExchangeResponseSchema,
	);
	if (!previousAuth) return false;
	try {
		const response = await getWithSchema(
			GOOGLE_REFRESH_ROUTE,
			GoogleRefreshResponseSchema,
			{
				headers: await getGoogleAuthHeaders(),
			},
		);
		if (previousAuth.tokens !== response.tokens) {
			const newAuth = { ...previousAuth, tokens: response.tokens };
			await saveAuthToDatabase("google", newAuth);
		}
		return true;
	} catch (err) {
		console.error(`failed to check google authentication: ${err}`);
		return false;
	}
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
