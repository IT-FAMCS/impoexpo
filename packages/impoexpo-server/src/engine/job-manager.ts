import type { Project } from "@impoexpo/shared/schemas/project/ProjectSchema";
import type { Session } from "better-sse";
import * as uuid from "uuid";
import { childLogger } from "../logger";
import type { ProjectStatusNotification } from "@impoexpo/shared/schemas/project/ProjectStatusSchemas";
import { executeJobNodes } from "./node-executor";

const logger = childLogger("jobs");
export const jobs: Map<string, Job> = new Map();

export class Job {
	public session?: Session;
	public id: string;
	public project: Project;
	public processing = false;

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
		this.session.push(
			{
				type,
				message:
					typeof message === "object" ? JSON.stringify(message) : message,
			} satisfies ProjectStatusNotification,
			"notification",
		);
		if (serverShouldLog) childLogger(`jobs/${this.id}`)[type](message);
	}

	public terminate(message: string) {
		if (!this.session) return;
		this.processing = false;
		this.session.push(message, "terminate");
		childLogger(`jobs/${this.id}`).info(`terminating job | reason: ${message}`);
	}

	public run() {
		if (this.processing) return;
		this.processing = true;
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
