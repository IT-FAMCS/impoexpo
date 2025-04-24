import type { BaseNode } from "@impoexpo/shared/nodes/node-types";
import type * as v from "valibot";
import type { Job } from "./job-manager";
import { childLogger } from "../logger";
import { glob } from "glob";
import * as path from "node:path";
export const defaultNodeHandlers: Record<
	string,
	NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
> = {};

export type NodeHandlerFunction<
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
> = (
	data: ResolveEntries<TIn>,
	job: Job,
) => ResolveEntries<TOut> | ResolveEntries<TOut>[];

export const registerHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	node: BaseNode<TIn, TOut>,
	handler: NodeHandlerFunction<TIn, TOut>,
) => {
	const id = `${node.category}-${node.name}`;
	if (id in defaultNodeHandlers)
		throw new Error(`a handler for node "${id}" has already been registered`);
	childLogger("nodes").debug(`\t\t-> registering handler for ${id}`);
	defaultNodeHandlers[id] = handler as NodeHandlerFunction<
		v.ObjectEntries,
		v.ObjectEntries
	>;
};

export const registerDefaultNodes = async () => {
	const logger = childLogger("nodes");
	logger.info("registering builtin nodes");

	// TODO: this isn't exactly safe...
	const entries = await glob("./handlers/**/*.ts", {
		cwd: import.meta.dirname,
	});
	await Promise.all(
		entries.map(async (entry) => {
			logger.info(`\t-> importing ${path.basename(entry)}`);
			await import(`./${entry.replace(".ts", "")}`);
		}),
	);
};

export type ResolveEntries<T extends v.ObjectEntries> = {
	[key in keyof T]: v.InferOutput<T[key]>;
};
