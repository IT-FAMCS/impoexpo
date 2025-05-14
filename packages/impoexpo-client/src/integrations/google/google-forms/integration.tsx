import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import GoogleAuthenticator from "../GoogleAuthenticator";
import GoogleVerifier from "../GoogleVerifier";
import { checkGoogleAuthentication } from "../common";
import { GoogleFormsHydrator } from "./GoogleFormsHydrator";
import { useGoogleFormsHydratorStore } from "./store";
import { registerIntegration } from "@/integrations/integrations";
import { registerGoogleFormNode } from "./nodes";
import {
	type GoogleFormsProjectIntegration,
	GoogleFormsProjectIntegrationSchema,
} from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsProjectIntegrationSchema";
import { getAuthFromDatabase } from "@/db/auth";
import { GoogleExchangeResponseSchema } from "@impoexpo/shared/schemas/integrations/google/GoogleExchangeResponseSchema";
import * as v from "valibot";

registerIntegration({
	id: "google-forms",
	title: msg`Google Forms`,
	icon: <Icon icon="simple-icons:googleforms" />,
	read: true,
	write: false,
	checkAuthenticated: checkGoogleAuthentication,

	async getProjectInformation() {
		const forms = useGoogleFormsHydratorStore.getState().usedForms;
		const tokens = (
			await getAuthFromDatabase("google", GoogleExchangeResponseSchema)
		)?.tokens;
		if (!tokens) return {};

		return {
			auth: { tokens },
			data: { forms },
		} satisfies GoogleFormsProjectIntegration;
	},

	async onProjectInformationLoaded(data) {
		if (!v.is(GoogleFormsProjectIntegrationSchema, data)) return;
		for (const [id, layout] of Object.entries(data.data.forms)) {
			useGoogleFormsHydratorStore.getState().addUsedForm(id, layout);
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
	verifier: (success, reset) => (
		<GoogleVerifier onSuccess={success} onReset={reset} />
	),
	hydrator: (callback) => <GoogleFormsHydrator callback={callback} />,
	selectedItemsRenderer: () =>
		Object.entries(useGoogleFormsHydratorStore.getState().usedForms).map(
			(form) => ({
				className: "p-2",
				startContent: <Icon width={24} icon="simple-icons:googleforms" />,
				title: form[1].title ?? form[1].documentTitle,
				description: <Trans>Google Forms</Trans>,
				key: form[0],
			}),
		),
});
