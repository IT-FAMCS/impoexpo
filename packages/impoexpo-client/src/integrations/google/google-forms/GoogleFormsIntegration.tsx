import type { Integration } from "@/types/Integration";
import { Icon } from "@iconify/react/dist/iconify.js";
import { checkGoogleAuthentication } from "../common";
import GoogleAuthenticator from "../GoogleAuthenticator";
import GoogleVerificator from "../GoogleVerificator";
import { GoogleFormsHydrator } from "./GoogleFormsHydrator";

export const GoogleFormsIntegration: Integration = {
	id: "google-forms",
	title: "Google Forms",
	icon: <Icon icon="simple-icons:googleforms" />,
	read: true,
	write: false,
	checkAuthenticated: checkGoogleAuthentication,

	authenticator: (callback) => (
		<GoogleAuthenticator
			onSuccess={callback}
			scopes={[
				"email",
				"profile",
				"https://www.googleapis.com/auth/forms.body.readonly",
				"https://www.googleapis.com/auth/forms.responses.readonly",
				"https://www.googleapis.com/auth/drive.readonly",
			]}
		/>
	),
	verificator: (success, reset) => (
		<GoogleVerificator onSuccess={success} onReset={reset} />
	),
	hydrator: (callback) => <GoogleFormsHydrator />,
};
