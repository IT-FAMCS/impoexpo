import type { Project } from "@impoexpo/shared/schemas/project/ProjectSchema";
import type { Session } from "better-sse";
import * as uuid from "uuid";
import type * as v from "valibot";
import { childLogger } from "../logger";
import type { ProjectStatusNotification } from "@impoexpo/shared/schemas/project/ProjectStatusSchemas";
import { executeJobNodes } from "./node-executor";
import {
	integrationNodeHandlerRegistrars,
	type NodeHandlerFunction,
} from "./node-handler-utils";

const logger = childLogger("jobs");
export const jobs: Map<string, Job> = new Map();

export class Job {
	public session?: Session;
	public id: string;
	public project: Project;
	public processing = false;
	public customNodes: Record<
		string,
		NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
	> = {};

	constructor(id: string, project: Project) {
		this.id = id;
		this.project = project;
	}

	public attachSession(session: Session) {
		logger.info(`attaching an event stream to a job with id ${this.id}`);
		this.session = session;
	}

	public notify(
		type: ProjectStatusNotification["type"],
		message: Record<string, unknown> | string,
		serverShouldLog = false,
	) {
		if (!this.session) return;
		if (serverShouldLog || type === "error")
			childLogger(`jobs/${this.id}`)[type](message);

		try {
			this.session.push(
				{
					type,
					message:
						typeof message === "object" ? JSON.stringify(message) : message,
				} satisfies ProjectStatusNotification,
				"notification",
			);
		} catch (err) {
			childLogger(`jobs/${this.id}`).warn(
				"failed to send event to the SSE client, perhaps they disconnected abruptly?",
			);
		}
		this.processing = type !== "error";
	}

	public complete() {
		if (!this.session) return;
		childLogger(`jobs/${this.id}`).info("job was successfully completed");
		this.session.push({}, "done");
		this.processing = false;
	}

	public run() {
		if (this.processing) return;
		this.processing = true;

		for (const id of Object.keys(this.project.integrations)) {
			if (!(id in integrationNodeHandlerRegistrars)) {
				childLogger(`jobs/${this.id}`).warn(
					`no node handler registrar was found for integration ${id}, but it's used in the job. this is likely to break things!`,
				);
				continue;
			}

			const registrar = integrationNodeHandlerRegistrars[id];
			this.customNodes = { ...this.customNodes, ...registrar(this.project) };
		}
		executeJobNodes(this);
	}
}

export const createJob = (project: Project): string => {
	let id = uuid.v4();
	while (jobs.has(id)) id = uuid.v4();

	logger.info(`creating a new job with id ${id}`);
	jobs.set(id, new Job(id, project));
	return id;
};
