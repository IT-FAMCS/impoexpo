import {
	genericRegisterAsyncHandler,
	type NodeHandlerFunction,
	registerHandler,
	registerIntegrationNodeHandlerRegistrar,
} from "../../../node-handler-utils";
import * as v from "valibot";
import * as word from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { type IPatch, type Run, TextRun, patchDocument } from "docx";
import { MicrosoftWordProjectIntegrationSchema } from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordProjectIntegrationSchema";
import { createWordDocumentBaseNode } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { registerBaseNodes } from "@impoexpo/shared/nodes/node-database";

const runs: Array<Run> = [];

registerHandler(word.WORD_TEXT_NODE, (ctx) => {
	runs.push(
		new TextRun({
			bold: ctx.bold,
			italics: ctx.italics,
			strike: ctx.strikethrough,
			underline: ctx.underline ? { type: "single" } : undefined,
			text: `${ctx.text}`,
		}),
	);

	return {
		run: {
			type: "text",
			index: runs.length - 1,
		} satisfies word.WordRunType,
	};
});

registerIntegrationNodeHandlerRegistrar("microsoft-word", (project) => {
	const integration = project.integrations["microsoft-word"];
	if (!integration || !v.is(MicrosoftWordProjectIntegrationSchema, integration))
		throw new Error();

	const handlers: Record<
		string,
		NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
	> = {};

	for (const document of integration.data.documents) {
		const base = createWordDocumentBaseNode(document.filename, document.layout);
		registerBaseNodes(base);

		genericRegisterAsyncHandler(handlers, base, async (ctx) => {
			const patches: Record<string, IPatch> = {};
			for (const placeholder of document.layout.placeholders) {
				if (ctx[placeholder.formattedName]) {
					console.log(ctx[placeholder.formattedName] as word.WordRunType);
					patches[placeholder.formattedName] = {
						type: "paragraph",
						children: [
							runs[
								(ctx[placeholder.formattedName] as word.WordRunType).index
							] as Run,
						],
					};
				}
			}
			const buffer = await patchDocument({
				data: ctx["~job"].files[document.clientIdentifier],
				outputType: "nodebuffer",
				patches,
			});
			// TODO: actually save the file
		});
	}

	return handlers;
});
