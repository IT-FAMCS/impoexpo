import { google } from "googleapis";

export const getGoogleClient = () =>
	new google.auth.OAuth2({
		clientId: process.env.GOOGLE_CLIENT_ID,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		redirectUri: process.env.GOOGLE_CLIENT_REDIRECT_URL,
	});
