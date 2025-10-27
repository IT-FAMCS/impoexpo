import type { BaseNode } from "@impoexpo/shared/nodes/node-types";
import type * as v from "valibot";
import type { Job } from "./job-manager";
import { childLogger } from "../logger";
import { glob } from "glob";
import * as path from "node:path";
import type { Project } from "@impoexpo/shared/schemas/project/ProjectSchema";
import { initializeNodes } from "@impoexpo/shared/nodes/node-database";

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

export type NodeExecutorContext<TIn extends v.ObjectEntries> = {
	"~job": Job;
	"~persist": <T>(key: string, initial?: T) => () => T;
	"~reduce": <T>(
		reducer: (acc: T, cur: ResolveEntries<TIn>) => T,
		initial: T,
	) => Promise<T>;
	"~iterators": () => {
		iterators: Iterator[] | undefined;
		skip: () => void;
	};
} & ResolveEntries<TIn>;

export type InputPath = {
	node: string;
	entry: string;
	depth: number;
	parent?: Record<string, InputPath[]>;
};

export type Iterator = {
	node: string;
	length: number;
	items: ResolveEntries<v.ObjectEntries>[];
	index: number;
	depth: number;
};

export type NodeOutput<TOut extends v.ObjectEntries> =
	| ResolveEntries<TOut>
	| ResolveEntries<TOut>[];

export type NodeHandlerFunction<
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
> = (ctx: NodeExecutorContext<TIn>) => Promise<HandlerReturnType<TOut>>;

type HandlerReturnType<TOut extends v.ObjectEntries> =
	ResolveEntries<TOut> extends Record<string, never>
		? // biome-ignore lint/suspicious/noConfusingVoidType: this type is used exclusively for return types
			void
		: NodeOutput<TOut>;

export const registerHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	node: BaseNode<TIn, TOut>,
	handler: (ctx: NodeExecutorContext<TIn>) => HandlerReturnType<TOut>,
) => genericRegisterHandler(defaultNodeHandlers, node, handler);

export const registerAsyncHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	node: BaseNode<TIn, TOut>,
	handler: (ctx: NodeExecutorContext<TIn>) => Promise<HandlerReturnType<TOut>>,
) => genericRegisterAsyncHandler(defaultNodeHandlers, node, handler);

export const unregisterHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	node: BaseNode<TIn, TOut>,
) => genericUnregisterHandler(defaultNodeHandlers, node);

export const genericRegisterHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	registry: Record<
		string,
		NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
	>,
	node: BaseNode<TIn, TOut>,
	handler: (ctx: NodeExecutorContext<TIn>) => HandlerReturnType<TOut>,
) => {
	const id = `${node.category}-${node.name}`;
	if (id in registry)
		throw new Error(`a handler for node "${id}" has already been registered`);
	childLogger("nodes").debug(`\t\t-> registering handler for ${id}`);
	registry[id] = async (ctx) => {
		const result = handler(ctx as unknown as NodeExecutorContext<TIn>);
		return result || {};
	};
};

export const genericRegisterAsyncHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	registry: Record<
		string,
		NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
	>,
	node: BaseNode<TIn, TOut>,
	handler: (ctx: NodeExecutorContext<TIn>) => Promise<HandlerReturnType<TOut>>,
) => {
	const id = `${node.category}-${node.name}`;
	if (id in registry) {
		childLogger("nodes").warn(
			`a handler for node "${id}" has already been registered`,
		);
		return;
	}
	childLogger("nodes").debug(`\t\t-> registering handler (async) for ${id}`);
	registry[id] = async (ctx) => {
		const result = await handler(ctx as unknown as NodeExecutorContext<TIn>);
		return result || {};
	};
};

export const genericUnregisterHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	registry: Record<
		string,
		NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
	>,
	node: BaseNode<TIn, TOut>,
) => {
	const id = `${node.category}-${node.name}`;
	if (!(id in registry)) {
		childLogger("nodes").warn(
			`attempted to unregister a handler for node "${id}" which doesn't have a registered handler`,
		);
		return;
	}
	delete registry[id];
};

export const registerIntegrationNodeHandlerRegistrar = (
	id: string,
	loader: (
		project: Project,
	) => Record<string, NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>>,
) => {
	childLogger("nodes").debug(
		`\t\t-> registering node handler registrar for integration ${id}`,
	);
	integrationNodeHandlerRegistrars[id] = loader;
};

export const prepareNodes = async () => {
	const start = performance.now();
	await registerDefaultNodes();
	await registerIntegrationNodeLoaders();
	initializeNodes();
	childLogger("nodes").info(
		`--- node initialization done in ${Math.round(performance.now() - start)}ms ---`,
	);
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
