import type { Express } from "express";
import { logger } from "../../logger";
import { MICROSOFT_OFFICE_LAYOUT_ROUTE } from "@impoexpo/shared/schemas/integrations/microsoft/static";
import { defaultRatelimiter } from "../../common";
import type { FaultyAction } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
//import { extractOfficePlaceholders } from "./extractor";
import multer from "multer";
import { registerIntegration } from "../../registry";
const upload = multer();
import { MICROSOFT_WORD_INTEGRATION_ID } from "@impoexpo/shared/schemas/integrations/microsoft/word/static";

registerIntegration({
	id: MICROSOFT_WORD_INTEGRATION_ID,
	dependencies: ["microsoft-shared"],
	async registerEndpoints(app) {},
});

/* export const registerMicrosoftEndpoints = (app: Express) => {
	logger.info("\t-> registering microsoft endpoints");

	app.post(
		MICROSOFT_OFFICE_LAYOUT_ROUTE,
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
				res.json(await extractOfficePlaceholders(req.file));
			} catch (err) {
				res.status(500).json({
					ok: false,
					internal: true,
					error: `${err}`,
				} satisfies FaultyAction);
			}
		},
	);
};
 */
