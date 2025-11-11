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
	CREATE_PROJECT_ROUTE,
	PROJECT_TRANSFER_STATUS_ROUTE,
	RETRIEVE_PROJECT_OUTPUT_ROUTE,
	UPLOAD_PROJECT_FILE_ROUTE,
} from "@impoexpo/shared/schemas/project/static";
import multer from "multer";
const upload = multer();
import TTLCache from "@isaacs/ttlcache";
import contentDisposition from "content-disposition";

// TODO: a defaults.json file would be nice!
export const projectOutputFilesCache = new TTLCache<string, File>({
	max: Number.parseInt(process.env.IN_MEMORY_PROJECT_OUTPUTS_MAX ?? "100", 10), // 100 entries by default
	ttl: Number.parseInt(
		process.env.IN_MEMORY_PROJECT_OUTPUTS_TTL ?? "60000",
		10,
	), // a minute by default
});

export const registerProjectEndpoints = (app: Express) => {
	logger.info("\t-> registering project endpoints");

	app.post(CREATE_PROJECT_ROUTE, body(), async (req, res) => {
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

	app.get(`${RETRIEVE_PROJECT_OUTPUT_ROUTE}/:id`, async (req, res) => {
		if (!req.params.id) {
			res.status(400).json({
				ok: false,
				internal: false,
				error: "no output identifier was specified",
			} satisfies FaultyAction);
			return;
		}

		const file = projectOutputFilesCache.get(req.params.id);
		if (!file) {
			res.status(400).json({
				ok: false,
				internal: false,
				error: `no output with identifier ${req.params.id} was found`,
			} satisfies FaultyAction);
			return;
		}

		res.set("Content-Disposition", contentDisposition(file.name));
		res.set("Content-Type", file.type);
		res.end(await file.bytes());
	});

	app.post(
		`${UPLOAD_PROJECT_FILE_ROUTE}/:id`,
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

			const job = jobs[req.params.id];
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

	app.get(`${PROJECT_TRANSFER_STATUS_ROUTE}/:id`, async (req, res) => {
		const job = jobs[req.params.id];
		if (!job) {
			res.status(400).send({
				ok: false,
				internal: false,
				error: `no job with the id "${req.params.id}" is currently running`,
			} satisfies FaultyAction);
			return;
		}

		const allFiles = Object.values(job.project.integrations).flatMap(
			(i) => i.files ?? [],
		);
		if (allFiles.some((f) => !Object.keys(job.files).includes(f))) {
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
