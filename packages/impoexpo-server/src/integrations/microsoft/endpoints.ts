import type { Express } from "express";
import { logger } from "../../logger";
import { MICROSOFT_OFFICE_LAYOUT_ROUTE } from "@impoexpo/shared/schemas/integrations/microsoft/endpoints";
import type { MicrosoftOfficeDocumentLayout } from "@impoexpo/shared/schemas/integrations/microsoft/MicrosoftOfficeLayoutSchema";
import { defaultRatelimiter } from "../../common";
import type { FaultyAction } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import multer from "multer";
import { extractOfficePlaceholders } from "./extractor";
const upload = multer();

export const registerMicrosoftEndpoints = (app: Express) => {
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
