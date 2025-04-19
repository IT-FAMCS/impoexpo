import { ListboxItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import GoogleAuthenticator from "../GoogleAuthenticator";
import GoogleVerificator from "../GoogleVerificator";
import { checkGoogleAuthentication } from "../common";
import { GoogleFormsHydrator } from "./GoogleFormsHydrator";
import { useGoogleFormsHydratorStore } from "./store";
import { registerIntegration } from "@/integrations/integrations";
import type { GoogleFormsLayout } from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsLayoutSchema";
import { registerGoogleFormNode } from "./nodes";

registerIntegration({
	id: "google-forms",
	title: msg`Google Forms`,
	icon: <Icon icon="simple-icons:googleforms" />,
	read: true,
	write: false,
	checkAuthenticated: checkGoogleAuthentication,

	getPersistentInformation(prev) {
		const current = useGoogleFormsHydratorStore.getState().usedForms;
		return prev && "forms" in prev && typeof prev.forms === "object"
			? { forms: { ...prev.forms, ...current } }
			: { forms: current };
	},
	onPersistentInformationLoaded(data) {
		if (!("forms" in data)) return;
		for (const [id, layout] of Object.entries(
			(data as { forms: Record<string, GoogleFormsLayout> }).forms,
		)) {
			registerGoogleFormNode(id, layout);
		}
	},

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
		Object.entries(useGoogleFormsHydratorStore.getState().usedForms).map(
			(form) => (
				<ListboxItem
					className="p-3"
					startContent={<Icon icon="simple-icons:googleforms" />}
					description={<Trans>Google Forms</Trans>}
					key={form[0]}
				>
					{form[1].title ?? form[1].documentTitle}
				</ListboxItem>
			),
		),
});
