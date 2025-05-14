import type { MicrosoftOfficeDocumentLayout } from "@impoexpo/shared/schemas/integrations/microsoft/MicrosoftOfficeLayoutSchema";
import { XMLParser } from "fast-xml-parser";
import * as zip from "@zip.js/zip.js";

enum DocumentType {
	WORD = 0,
	EXCEL = 1,
	POWERPOINT = 2,
}
const documentTypeMap: Record<string, DocumentType> = {
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		DocumentType.WORD,
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
		DocumentType.EXCEL,
	"application/vnd.openxmlformats-officedocument.presentationml.presentation":
		DocumentType.POWERPOINT,
};
const PLACEHOLDER_REGEX =
	/\{\{\s*([a-zA-Z0-9\-_]+)\s*(?:\[([a-zA-Z<>]*)\])?\s*(?::([^{}]*))?\s*\}\}/gu;

export const extractOfficePlaceholders = async (
	file: Express.Multer.File,
): Promise<MicrosoftOfficeDocumentLayout> => {
	const reader = new zip.ZipReader(new Blob([file.buffer]).stream());
	const entries = await reader.getEntries();

	const type = documentTypeMap[file.mimetype];
	const layout: MicrosoftOfficeDocumentLayout = {
		filename: file.originalname,
		placeholders: [],
	};

	const readAsString = async (entry: zip.Entry): Promise<string> => {
		if (!entry.getData)
			throw new Error(`entry.getData() was undefined (${entry.filename})`);
		const writer = new zip.TextWriter();
		await entry.getData(writer);
		return await writer.getData();
	};

	const processText = (data: string) => {
		for (const match of data.matchAll(PLACEHOLDER_REGEX)) {
			const name = match[1];
			const placeholderType = match[2] ?? "string";
			const description = match[3];
			// TODO: support arrays?
			if (placeholderType !== "string" && placeholderType !== "number")
				throw new Error(`unsupported placeholder type "${placeholderType}"`);

			layout.placeholders.push({
				originalName: match[0].slice(2, match[0].length - 2),
				formattedName: name,
				type: placeholderType,
				description: description ? description.trim() : null,
			});
		}
	};

	switch (type) {
		case DocumentType.WORD: {
			const documentEntry = entries.find(
				(e) => e.filename === "word/document.xml",
			);
			if (!documentEntry || !documentEntry.getData)
				throw new Error("word/document.xml wasn't found in the archive!");

			const data = await readAsString(documentEntry);
			const document = new XMLParser().parse(data);

			// TODO: this is probably really, really cursed...
			const paragraphs = document["w:document"]["w:body"]["w:p"];
			// biome-ignore lint/suspicious/noExplicitAny: i don't have the entire specification on my hands
			const extractTextFromParagraph = (paragraph: any) => {
				const runs = paragraph["w:r"];
				if (!runs) return "";
				return Array.isArray(runs)
					? runs.map((r) => r["w:t"]).join("")
					: runs["w:t"];
			};
			const text = Array.isArray(paragraphs)
				? paragraphs.map((p) => extractTextFromParagraph(p)).join("\n")
				: extractTextFromParagraph(paragraphs);
			processText(text);
			break;
		}
		case DocumentType.EXCEL: {
			throw new Error("excel is currently not implemented!");
		}
		case DocumentType.POWERPOINT: {
			throw new Error("powerpoint is currently not implemented!");
		}
	}

	await reader.close();

	return layout;
};
