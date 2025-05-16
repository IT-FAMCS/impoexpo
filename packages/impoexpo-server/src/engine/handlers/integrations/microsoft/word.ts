import {
	genericRegisterAsyncHandler,
	type NodeHandlerFunction,
	registerHandler,
	registerIntegrationNodeHandlerRegistrar,
} from "../../../node-executor-utils";
import * as v from "valibot";
import * as word from "@impoexpo/shared/nodes/integrations/microsoft/word";
import {
	type IPatch,
	type Paragraph,
	type ParagraphChild,
	TextRun,
	patchDocument,
} from "docx";
import { MicrosoftWordProjectIntegrationSchema } from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordProjectIntegrationSchema";
import { createWordDocumentBaseNode } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { registerBaseNodes } from "@impoexpo/shared/nodes/node-database";
import * as path from "node:path";

registerHandler(word.WORD_TEXT_NODE, (ctx) => {
	return {
		run: {
			type: "text",
			native: [
				new TextRun({
					bold: ctx.bold,
					italics: ctx.italics,
					strike: ctx.strikethrough,
					underline: ctx.underline ? { type: "single" } : undefined,
					text: `${ctx.text}`,
				}),
			] satisfies ParagraphChild[],
		},
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

	const generated: Record<string, boolean> = {};
	for (const document of integration.data.documents) {
		const base = createWordDocumentBaseNode(document.filename, document.layout);
		registerBaseNodes(base);

		genericRegisterAsyncHandler(handlers, base, async (ctx) => {
			if (document.clientIdentifier in generated) return;

			const patches: Record<string, IPatch> = {};
			for (const placeholder of document.layout.placeholders) {
				if (ctx[placeholder.formattedName]) {
					patches[placeholder.formattedName] = {
						type: "paragraph",
						children: (ctx[placeholder.formattedName] as word.WordRun)
							.native as ParagraphChild[],
					};
				}
			}

			const buffer = await patchDocument({
				data: ctx["~job"].files[document.clientIdentifier],
				outputType: "nodebuffer",
				patches,
			});
			ctx["~job"].file(
				document.filename.replaceAll(".docx", "-patched.docx"),
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				buffer,
			);
			generated[document.clientIdentifier] = true;
		});
	}

	return handlers;
});
