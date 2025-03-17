import type { Integration } from "@/types/Integration";
import { Icon } from "@iconify/react";
import { checkGoogleAuthentication } from "../common";
import GoogleAuthenticator from "../GoogleAuthenticator";
import GoogleVerificator from "../GoogleVerificator";
import { GoogleFormsHydrator } from "./GoogleFormsHydrator";
import { useGoogleFormsHydratorStore } from "./store";
import { ListboxItem } from "@heroui/react";

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
	hydrator: (callback) => <GoogleFormsHydrator callback={callback} />,
	selectedItemsRenderer: () =>
		Array.from(useGoogleFormsHydratorStore.getState().usedForms).map((form) => (
			<ListboxItem
				className="p-3"
				startContent={<Icon icon="simple-icons:googleforms" />}
				description="Google Forms"
				key={form.id}
			>
				{form.name}
			</ListboxItem>
		)),
};
