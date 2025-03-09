export const GOOGLE_AUTH_KEY = "google_auth";

export const checkGoogleAuthentication = async () => {
	if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
		throw new Error(
			"couldn't locate google client ID in environment variables",
		);
	}

	if (localStorage.getItem(GOOGLE_AUTH_KEY) === null) return false;
	try {
		// biome-ignore lint/style/noNonNullAssertion: already checked before
		const auth = JSON.parse(localStorage.getItem(GOOGLE_AUTH_KEY)!);
		console.log(auth);
		return true;
	} catch (err) {
		console.error(err);
		return false;
	}
};
