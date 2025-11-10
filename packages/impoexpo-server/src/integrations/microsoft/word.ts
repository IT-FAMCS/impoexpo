import { childLogger } from "../../logger";
import { defaultRatelimiter } from "../../common";
import type { FaultyAction } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import multer from "multer";
import { registerIntegration } from "../../registry";
const upload = multer();
import {
	MICROSOFT_WORD_INTEGRATION_ID,
	MICROSOFT_WORD_LAYOUT_ROUTE,
} from "@impoexpo/shared/schemas/integrations/microsoft/word/static";
import { dotnetRuntimeExports } from "./common/runtime";
import {
	type MicrosoftWordDocumentLayout,
	MicrosoftWordDocumentPlaceholderSchema,
} from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";
import * as v from "valibot";

registerIntegration({
	id: MICROSOFT_WORD_INTEGRATION_ID,
	dependencies: ["microsoft-shared"],
	async registerEndpoints(app) {
		const _logger = childLogger("integrations/microsoft/word");
		app.post(
			MICROSOFT_WORD_LAYOUT_ROUTE,
			defaultRatelimiter("1 hour", 15),
			upload.single("file"),
			async (req, res) => {
				if (!req.file) {
					res.status(400).json({
						ok: false,
						internal: false,
						error: "no file present in the form data",
					} satisfies FaultyAction);
					return;
				}

				try {
					const extractMethod =
						// @ts-expect-error
						dotnetRuntimeExports.SimpleOfficePatchers.Patchers.WordPatcher
							.ExtractPlaceholders;
					if (!extractMethod) {
						throw new Error(`SimpleOfficePatchers was not initialized (SimpleOfficePatchers.Patchers.WordPatcher
							.ExtractPlaceholders() was not found)`);
					}

					const placeholders = JSON.parse(extractMethod(req.file.buffer));
					const parsed = v.safeParse(
						v.array(MicrosoftWordDocumentPlaceholderSchema),
						placeholders,
					);

					if (!parsed.success) {
						throw new Error(
							`SimpleOfficePatchers returned invalid JSON from SimpleOfficePatchers.Patchers.WordPatcher.ExtractPlaceholders():\n${v.summarize(parsed.issues)}`,
						);
					}
					res.json({ placeholders } satisfies MicrosoftWordDocumentLayout);
				} catch (err) {
					res.status(500).json({
						ok: false,
						internal: true,
						error: `${err}`,
					} satisfies FaultyAction);
				}
			},
		);
	},
});
