import type { BaseNode } from "@impoexpo/shared/nodes/node-types";
import type * as v from "valibot";
import type { Job } from "./job-manager";
import { childLogger } from "../logger";
import { glob } from "glob";
import * as path from "node:path";
import type { Project } from "@impoexpo/shared/schemas/project/ProjectSchema";

export const defaultNodeHandlers: Record<
	string,
	NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
> = {};

export const integrationNodeHandlerRegistrars: Record<
	string,
	(
		project: Project,
	) => Record<string, NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>>
> = {};

export type NodeOutput<TOut extends v.ObjectEntries> =
	| ResolveEntries<TOut>
	| ResolveEntries<TOut>[];
export type NodeHandlerFunction<
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
> = (data: ResolveEntries<TIn>, job: Job) => Promise<NodeOutput<TOut>>;

export const registerHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	node: BaseNode<TIn, TOut>,
	handler: (data: ResolveEntries<TIn>, job: Job) => NodeOutput<TOut>,
) => {
	const id = `${node.category}-${node.name}`;
	if (id in defaultNodeHandlers)
		throw new Error(`a handler for node "${id}" has already been registered`);
	childLogger("nodes").debug(`\t\t-> registering handler for ${id}`);
	defaultNodeHandlers[id] = async (data, job) =>
		(handler as NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>)(
			data,
			job,
		);
};

export const registerIntegrationNodeHandlerRegistrar = (
	id: string,
	loader: (
		project: Project,
	) => Record<string, NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>>,
) => {
	childLogger("nodes").debug(
		`\t\t-> registering integration-specific node handler registrar for ${id}`,
	);
	integrationNodeHandlerRegistrars[id] = loader;
};

export const registerDefaultNodes = async () => {
	const logger = childLogger("nodes");
	logger.info("registering builtin nodes");

	const entries = await glob("./**/*.ts", {
		cwd: path.join(import.meta.dirname, "handlers/builtin"),
	});
	for (const entry of entries) {
		logger.info(`\t-> importing ${path.basename(entry)}`);
		await import(`./handlers/builtin/${entry.replace(".ts", "")}`);
	}
};

export const registerIntegrationNodeLoaders = async () => {
	const logger = childLogger("nodes");
	logger.info("registering integration-specific nodes");

	const entries = await glob("./**/*.ts", {
		cwd: path.join(import.meta.dirname, "handlers/integrations"),
	});
	for (const entry of entries) {
		logger.info(`\t-> importing ${entry}`);
		await import(`./handlers/integrations/${entry.replace(".ts", "")}`);
	}
};

export type ResolveEntries<T extends v.ObjectEntries> = {
	[key in keyof T]: v.InferOutput<T[key]>;
};
