import type { Express } from "express";
import { logger } from "../logger";
import { createSession } from "better-sse";
import type {
	FaultyAction,
	FaultyActionInput,
} from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import { body, validationResult } from "express-validator";
import * as v from "valibot";
import { ProjectSchema } from "@impoexpo/shared/schemas/project/ProjectSchema";
import { createJob, jobs } from "../engine/job-manager";
import {
	CREATE_PROJECT_ENDPOINT,
	PROJECT_TRANSFER_STATUS_ENDPOINT,
	UPLOAD_PROJECT_FILE_ENDPOINT,
} from "@impoexpo/shared/schemas/project/endpoints";
import multer from "multer";
const upload = multer();

export const registerProjectEndpoints = (app: Express) => {
	logger.info("\t-> registering project endpoints");

	app.post(CREATE_PROJECT_ENDPOINT, body(), async (req, res) => {
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

	app.post(
		`${UPLOAD_PROJECT_FILE_ENDPOINT}/:id`,
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

			if (!("identifier" in req.body)) {
				res.status(400).json({
					ok: false,
					internal: false,
					error: "no file identifier present in the form data",
				} satisfies FaultyAction);
				return;
			}

			const job = jobs.get(req.params.id);
			if (!job) {
				res.status(400).send({
					ok: false,
					internal: false,
					error: `no job with the id "${req.params.id}" was found`,
				} satisfies FaultyAction);
				return;
			}

			try {
				job.files[req.body.identifier] = req.file.buffer;
				res.status(200).json({ ok: true } satisfies FaultyActionInput);
			} catch (err) {
				res.status(500).json({
					ok: false,
					internal: true,
					error: `${err}`,
				} satisfies FaultyAction);
			}
		},
	);

	app.get(`${PROJECT_TRANSFER_STATUS_ENDPOINT}/:id`, async (req, res) => {
		const job = jobs.get(req.params.id);
		if (!job) {
			res.status(400).send({
				ok: false,
				internal: false,
				error: `no job with the id "${req.params.id}" is currently running`,
			} satisfies FaultyAction);
			return;
		}

		if (Object.keys(job.files).some((f) => !job.project.files.includes(f))) {
			res.status(400).send({
				ok: false,
				internal: false,
				error: `not all files for job "${req.params.id}" have been uploaded`,
			} satisfies FaultyAction);
			return;
		}

		const session = await createSession(req, res);
		job.attachSession(session);
		job.run();
	});
};
