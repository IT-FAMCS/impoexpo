import type { Express } from "express";
import { logger } from "../logger";
import { createSession } from "better-sse";
import type { FaultyAction } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import { body, validationResult } from "express-validator";
import * as v from "valibot";
import { ProjectSchema } from "@impoexpo/shared/schemas/project/ProjectSchema";
import { createJob, jobs } from "../engine/job-manager";

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
				error: `${err}`,
			} satisfies FaultyAction);
			return;
		}

		res.send({ job: createJob(req.body) });
	});

	app.get("/project/status/:id", async (req, res) => {
		if (!jobs.has(req.params.id)) {
			res.status(400).send({
				ok: false,
				internal: false,
				error: `no job with the id ${req.params.id} is currently running'`,
			} satisfies FaultyAction);
			return;
		}

		const session = await createSession(req, res);
		const job = jobs.get(req.params.id);
		if (!job) return;

		job.attachSession(session);
		job.run();
	});
};
