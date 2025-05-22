import {
	genericRegisterAsyncHandler,
	type NodeHandlerFunction,
	registerAsyncHandler,
	registerHandler,
	registerIntegrationNodeHandlerRegistrar,
} from "../../../node-executor-utils";
import * as v from "valibot";
import * as word from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { MicrosoftWordProjectIntegrationSchema } from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordProjectIntegrationSchema";
import { createWordDocumentBaseNode } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { registerBaseNodes } from "@impoexpo/shared/nodes/node-database";
/* 
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

const numberIndexToAlphabetical = (idx: number) => {
	let result = "";
	let current = idx;
	while (current > 0) {
		const remainder = (current - 1) % 26;
		result += String.fromCharCode(65 + remainder);
		current = Math.floor((current - 1) / 26);
	}
	return result;
};

const numberIndexToRoman = (idx: number) => {
	const roman: Record<string, number> = {
		M: 1000,
		CM: 900,
		D: 500,
		CD: 400,
		C: 100,
		XC: 90,
		L: 50,
		XL: 40,
		X: 10,
		IX: 9,
		V: 5,
		IV: 4,
		I: 1,
	};
	let current = idx;
	let result = "";
	for (const key of Object.keys(roman)) {
		const repetitions = Math.floor(current / roman[key]);
		current -= repetitions * roman[key];
		result += key.repeat(repetitions);
	}
	return result;
};

const getListStyle = (index: number, style: word.WordListType) => {
	switch (style) {
		case "alpha-lowercase-dot":
			return `${numberIndexToAlphabetical(index).toLowerCase()}.`;
		case "alpha-uppercase-dot":
			return `${numberIndexToAlphabetical(index)}.`;
		case "alpha-lowercase-parentheses":
			return `${numberIndexToAlphabetical(index).toLowerCase()})`;
		case "alpha-uppercase-parentheses":
			return `${numberIndexToAlphabetical(index)})`;
		case "digit-dot":
			return `${index}.`;
		case "digit-parentheses":
			return `${index})`;
		case "roman-lowercase":
			return `${numberIndexToRoman(index).toLowerCase()}.`;
		case "roman-uppercase":
			return `${numberIndexToRoman(index)}.`;
		case "bullet-dot":
			return "•";
		case "bullet-hyphen":
			return "⁃";
		case "bullet-triangle":
			return "‣";
	}
};

registerAsyncHandler(word.WORD_LIST_NODE, async (ctx) => {
	let idx = 1;
	const paragraphs = await ctx["~reduce"]<Paragraph[]>((acc, cur) => {
		acc.push(
			...cur.runs.flatMap((run) =>
				run.type === "text"
					? new Paragraph({
							alignment: ctx.alignment,
							children: [
								new TextRun(`${getListStyle(idx++, ctx.style)} `),
								...(run.native as ParagraphChild[]),
							],
						})
					: (run.native as Paragraph[]),
			),
		);
		return acc;
	}, []);
	return {
		run: { type: "list", native: paragraphs satisfies Paragraph[] },
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
		const base = createWordDocumentBaseNode(
			document.clientIdentifier,
			document.layout,
		);
		registerBaseNodes(base);

		genericRegisterAsyncHandler(handlers, base, async (ctx) => {
			if (document.clientIdentifier in generated) return;

			const patches: Record<string, IPatch> = {};
			for (const placeholder of document.layout.placeholders) {
				if (ctx[placeholder.formattedName]) {
					const run = ctx[placeholder.formattedName] as word.WordRun;
					patches[placeholder.originalName] = {
						type: run.type === "list" ? "file" : "paragraph",
						children:
							run.type === "list"
								? (run.native as Paragraph[])
								: (run.native as ParagraphChild[]),
					} as IPatch;
				}
			}

			const buffer = await patchDocument({
				data: ctx["~job"].files[document.clientIdentifier],
				outputType: "nodebuffer",
				patches,
				keepOriginalStyles: true,
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
 */
