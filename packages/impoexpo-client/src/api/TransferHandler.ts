import {
	ProjectOutputSchema,
	type Project,
	type ProjectOutput,
} from "@impoexpo/shared/schemas/project/ProjectSchema";
import {
	ProjectStatusNotificationSchema,
	type ProjectStatusNotification,
} from "@impoexpo/shared/schemas/project/ProjectStatusSchemas";
import type { MessageDescriptor } from "@lingui/core";
import { postForm, postWithSchemaAndResult, route } from "./common";
import {
	CREATE_PROJECT_ROUTE,
	PROJECT_TRANSFER_STATUS_ROUTE,
	UPLOAD_PROJECT_FILE_ROUTE,
} from "@impoexpo/shared/schemas/project/static";
import { UploadProjectResponseSchema } from "@impoexpo/shared/schemas/project/UploadProjectResponseSchema";
import { msg } from "@lingui/core/macro";
import { getFile } from "@/db/files";
import { array, parse } from "valibot";

export enum TransferHandlerState {
	IDLE = 0,

	UPLOADING_PROJECT = 1,
	UPLOADING_PROJECT_FILES = 2,

	CONNECTING = 3,
	CONNECTED = 4,
	RECONNECTING = 5,

	DONE = 6,
	TERMINATED = 7,
}

export type TerminationReason = {
	short: string | MessageDescriptor;
	technical: string;
};

export type FileUploadStatusChange = {
	uploaded: number;
	total: number;
};

export type TransferHandlerEvents = {
	"state-changed": (newState: TransferHandlerState) => void;
	notification: (notification: ProjectStatusNotification) => void;
	terminated: (reason: TerminationReason) => void;
	"file-uploaded": (info: FileUploadStatusChange) => void;
};

export class TransferHandler {
	public state: TransferHandlerState;
	public project: Project;
	public job: string;
	public terminationReason?: TerminationReason;

	// biome-ignore lint/suspicious/noExplicitAny: unknown can't be used here for whatever reason
	handlers: Map<keyof TransferHandlerEvents, Array<(obj: any) => void>> =
		new Map();

	public addEventListener<K extends keyof TransferHandlerEvents>(
		type: K,
		listener: TransferHandlerEvents[K],
	) {
		if (!this.handlers.has(type)) this.handlers.set(type, []);
		// biome-ignore lint/style/noNonNullAssertion: safe-guarded above
		this.handlers.get(type)!.push(listener);
	}

	constructor(project: Project) {
		this.state = TransferHandlerState.IDLE;
		this.project = project;
		this.job = "";
	}

	public start() {
		(async () => {
			await this.uploadProject();
			await this.uploadProjectFiles();
			await this.transfer();
		})();
	}

	open = false;
	public notifications: ProjectStatusNotification[] = [];
	public outputs: ProjectOutput[] = [];

	async transfer() {
		if (this.state === TransferHandlerState.TERMINATED) return;

		this.updateState(TransferHandlerState.CONNECTING);
		const eventSource = new EventSource(
			route(`${PROJECT_TRANSFER_STATUS_ROUTE}/${this.job}`),
		);

		eventSource.addEventListener(
			"open",
			() => {
				this.updateState(TransferHandlerState.CONNECTED);
				this.open = true;
			},
			false,
		);

		eventSource.addEventListener(
			"error",
			(err) => {
				if (this.open) {
					console.warn(
						`lost connection to /project/status/${this.job}, attempting to reconnect`,
					);
					this.updateState(TransferHandlerState.RECONNECTING);
				} else {
					this.terminate({
						short: msg`failed to connect to the server via SSE`,
						technical: `${err}`,
					});
					this.open = false;
				}
			},
			false,
		);

		eventSource.addEventListener(
			"notification",
			(n) => {
				try {
					const notification = parse(
						ProjectStatusNotificationSchema,
						JSON.parse(n.data),
					);
					this.notifications.push(notification);
					for (const listener of this.handlers.get("notification") ?? [])
						listener(notification);

					if (notification.type === "error") {
						this.terminate({
							short: msg`transfer was cancelled`,
							technical: `received an error notification: "${notification.message}"`,
						});
					}
				} catch (err) {
					this.terminate({
						short: msg`something is up with the server`,
						technical: `notification event sent invalid payload: ${err}`,
					});
				}
			},
			false,
		);

		eventSource.addEventListener(
			"done",
			(o) => {
				if (this.state === TransferHandlerState.TERMINATED) return;
				try {
					this.outputs = parse(array(ProjectOutputSchema), JSON.parse(o.data));
					this.updateState(TransferHandlerState.DONE);
					eventSource.close();
				} catch (err) {
					this.terminate({
						short: msg`something is up with the server`,
						technical: `done event sent invalid payload: ${err}`,
					});
				}
			},
			false,
		);
	}

	async uploadProjectFiles() {
		if (this.state === TransferHandlerState.TERMINATED) return;

		const files = Object.values(this.project.integrations).flatMap(
			(i) => i.files ?? [],
		);
		if (files.length === 0) return;
		this.updateState(TransferHandlerState.UPLOADING_PROJECT_FILES);

		try {
			let uploaded = 0;
			for (const id of files) {
				const file = await getFile(id);
				if (!file)
					throw new Error(
						`no file with identifier "${id}" was found in the local database`,
					);

				const form = new FormData();
				form.append("file", new Blob([file.data]));
				form.append("identifier", id);
				const response = await postForm(
					`${UPLOAD_PROJECT_FILE_ROUTE}/${this.job}`,
					form,
				);

				if (response.status !== 200) {
					throw new Error(
						`server returned status ${response.status} for file with id "${id}"`,
					);
				}

				uploaded++;
				for (const listener of this.handlers.get("file-uploaded") ?? [])
					listener({ uploaded: uploaded, total: files.length });
			}
		} catch (err) {
			this.terminate({
				short: msg`failed to upload project files`,
				technical: `${err}`,
			});
		}
	}

	async uploadProject() {
		if (this.state === TransferHandlerState.TERMINATED) return;
		this.updateState(TransferHandlerState.UPLOADING_PROJECT);

		try {
			const result = await postWithSchemaAndResult(
				CREATE_PROJECT_ROUTE,
				this.project,
				UploadProjectResponseSchema,
			);
			this.job = result.job;
		} catch (err) {
			this.terminate({
				short: msg`failed to upload the project`,
				technical: `${err}`,
			});
		}
	}

	updateState(newState: TransferHandlerState) {
		this.state = newState;
		for (const listener of this.handlers.get("state-changed") ?? [])
			listener(newState);
	}

	terminate(reason: TerminationReason) {
		this.terminationReason = reason;
		this.updateState(TransferHandlerState.TERMINATED);
	}
}
