import {
	type NodeHandlerFunction,
	registerIntegrationNodeHandlerRegistrar,
} from "../../../node-handler-utils";
import * as v from "valibot";
import { GoogleFormsProjectIntegrationSchema } from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsProjectIntegrationSchema";
import { createGoogleFormsBaseNode } from "@impoexpo/shared/nodes/integrations/google/google-forms";
import { extractGoogleAuth } from "../../../../integrations/google/middlewares";
import { getGoogleClient } from "../../../../integrations/google/helpers";
import { google } from "googleapis";

registerIntegrationNodeHandlerRegistrar("google-forms", (project) => {
	const integration = project.integrations["google-forms"];
	if (!integration || !v.is(GoogleFormsProjectIntegrationSchema, integration)) {
		return {};
	}

	const handlers: Record<
		string,
		NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
	> = {};
	for (const [id, layout] of Object.entries(integration.data.forms)) {
		const base = createGoogleFormsBaseNode(id, layout);
		handlers[`${base.category}-${base.name}`] = async (data, job) => {
			const auth = extractGoogleAuth(integration.auth.tokens);
			const client = getGoogleClient();
			client.setCredentials({
				access_token: auth.accessToken,
				refresh_token: auth.refreshToken,
				expiry_date: auth.expiryTimestamp,
			});

			const formsClient = google.forms({
				version: "v1",
				auth: client,
			});

			const response = await formsClient.forms.responses.list({
				formId: id,
			});
			if (response.status !== 200 || !response.data.responses) {
				job.notify("error", `failed to fetch responses for form with id ${id}`);
				return [];
			}

			const responses = response.data.responses.map((response) => {
				if (!response.answers) {
					// TODO: error
					return {};
				}
				const outputs: Record<string, unknown> = {};
				for (const [answerId, answer] of Object.entries(response.answers)) {
					const isNumberQuestion = integration.data.forms[id].items
						.find((i) => i.id === answerId)
						?.type.includes("number");
					if (
						answer.textAnswers?.answers?.length === 1 &&
						answer.textAnswers.answers[0].value
					) {
						outputs[answerId] = isNumberQuestion
							? Number.parseInt(answer.textAnswers.answers[0].value)
							: answer.textAnswers.answers[0].value;
					} else if (
						answer.textAnswers?.answers?.length &&
						answer.textAnswers.answers.length !== 1
					) {
						outputs[answerId] = answer.textAnswers.answers
							.filter((ans) => ans.value)
							.map((ans) =>
								isNumberQuestion
									? // biome-ignore lint/style/noNonNullAssertion: filtered out
										Number.parseInt(ans.value!)
									: // biome-ignore lint/style/noNonNullAssertion: filtered out
										ans.value!,
							);
					}
				}
				return outputs;
			});

			return responses;
		};
	}
	return handlers;
});
