import { google } from "googleapis";

export const googleEnvironmentVariablesPresent = () =>
	process.env.GOOGLE_CLIENT_ID &&
	process.env.GOOGLE_CLIENT_SECRET &&
	process.env.GOOGLE_CLIENT_REDIRECT_URL;

export const getGoogleClient = () =>
	new google.auth.OAuth2({
		clientId: process.env.GOOGLE_CLIENT_ID,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		redirectUri: process.env.GOOGLE_CLIENT_REDIRECT_URL,
	});
