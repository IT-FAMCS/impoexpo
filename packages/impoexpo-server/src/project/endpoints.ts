import type { Express } from "express";
import { logger } from "../logger";
import { createSession } from "better-sse";
import type { FaultyAction } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import { body, validationResult } from "express-validator";
import * as v from "valibot";
import { ProjectSchema } from "@impoexpo/shared/schemas/project/ProjectSchema";
import * as uuid from "uuid";

export const registerProjectEndpoints = (app: Express) => {
	logger.info("\t-> registering project endpoints");

	app.post("/project/upload", body(), async (req, res) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			res.status(400).send({
				ok: false,
				internal: false,
				error: result.array({ onlyFirstError: true })[0].msg,
			} satisfies FaultyAction);
			return;
		}

		try {
			v.parse(ProjectSchema, req.body);
		} catch (err) {
			res.status(400).send({
				ok: false,
				internal: false,
				error: err,
			});
			return;
		}

		res.send({ job: uuid.v4() });
	});

	/* app.get("/project/status", async (req, res) => {
        const session = await createSession(req, res);
    }); */
};
