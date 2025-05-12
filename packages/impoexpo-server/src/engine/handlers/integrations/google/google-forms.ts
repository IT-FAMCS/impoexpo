import {
	genericRegisterAsyncHandler,
	type NodeHandlerFunction,
	registerIntegrationNodeHandlerRegistrar,
} from "../../../node-handler-utils";
import * as v from "valibot";
import { GoogleFormsProjectIntegrationSchema } from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsProjectIntegrationSchema";
import { createGoogleFormsBaseNode } from "@impoexpo/shared/nodes/integrations/google/google-forms";
import { extractGoogleAuth } from "../../../../integrations/google/middlewares";
import { getGoogleClient } from "../../../../integrations/google/helpers";
import { google } from "googleapis";
import { registerBaseNodes } from "@impoexpo/shared/nodes/node-database";
import { isArray } from "@impoexpo/shared/nodes/node-utils";

registerIntegrationNodeHandlerRegistrar("google-forms", (project) => {
	const integration = project.integrations["google-forms"];
	if (!integration || !v.is(GoogleFormsProjectIntegrationSchema, integration)) {
		throw new Error();
	}

	const handlers: Record<
		string,
		NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
	> = {};

	for (const [id, layout] of Object.entries(integration.data.forms)) {
		const base = createGoogleFormsBaseNode(id, layout);
		registerBaseNodes(base);

		genericRegisterAsyncHandler(handlers, base, async (ctx) => {
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
			if (response.status !== 200) {
				throw new Error(`failed to fetch responses for form with id ${id}`);
			}

			const responses = (response.data.responses ?? []).map((response) => {
				if (!response.answers) {
					throw new Error(
						`failed to query responses: response with id ${response.responseId} did not provide any answers`,
					);
				}
				const outputs: Record<string, unknown> = {};
				for (const item of integration.data.forms[id].items) {
					const answerId = item.id;
					if (item.id in response.answers) {
						const answer = response.answers[item.id];
						const isNumberQuestion = integration.data.forms[id].items
							.find((i) => i.id === answerId)
							?.type.includes("number");
						const questionOutputsArray = isArray(base.entry(answerId).schema);

						if (
							!answer.textAnswers?.answers ||
							answer.textAnswers.answers.length === 0
						)
							continue;

						if (questionOutputsArray) {
							outputs[answerId] = answer.textAnswers.answers
								.filter((ans) => ans.value)
								.map((ans) =>
									isNumberQuestion
										? // biome-ignore lint/style/noNonNullAssertion: filtered out
											Number.parseInt(ans.value!)
										: // biome-ignore lint/style/noNonNullAssertion: filtered out
											ans.value!,
								);
						} else {
							outputs[answerId] = isNumberQuestion
								? // biome-ignore lint/style/noNonNullAssertion: checked above
									Number.parseInt(answer.textAnswers.answers[0].value!)
								: answer.textAnswers.answers[0].value;
						}
					} else {
						outputs[answerId] = null;
					}
				}

				return outputs;
			});

			return responses;
		});
	}
	return handlers;
});
