import type { BaseNode, ObjectEntry } from "@impoexpo/shared/nodes/node-types";
import type * as v from "valibot";
import type { Job } from "./job-manager";
import { childLogger } from "../logger";
import { glob } from "glob";
import * as path from "node:path";
import type { Project } from "@impoexpo/shared/schemas/project/ProjectSchema";
import { initializeNodes } from "@impoexpo/shared/nodes/node-database";
import type { flow } from "@impoexpo/shared/nodes/node-utils";

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

export type NodeOutput<TOut extends v.ObjectEntries> = TOut extends Record<
	string,
	never
>
	? Record<string, never>
	: Omit<
			ResolveEntries<TOut>,
			keyof IncludeFlows<TOut> | keyof IncludeSubfowArguments<TOut>
		>;

// null here signifies "void"
export type NodeReturnType = unknown | null;

export type NodeExecutorContext<
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
> = {
	"~job": Job;
	"~run": <TFlow extends keyof IncludeFlows<TOut>>(
		flow: TFlow,
		...args: IncludeSubfowArguments<TOut, TFlow> extends Record<string, never>
			? []
			: [args: IncludeSubfowArguments<TOut, TFlow>]
	) => Promise<NodeReturnType[]>;
	"~return": (value: unknown) => void;
} & ResolveEntries<TIn> &
	IncludeFlows<TOut>;

export type NodeHandlerFunction<
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
> = (ctx: NodeExecutorContext<TIn, TOut>) => Promise<NodeOutput<TOut>>;

type HandlerReturnType<TOut extends v.ObjectEntries> =
	NodeOutput<TOut> extends Record<string, never>
		? // biome-ignore lint/suspicious/noConfusingVoidType: this type is used exclusively for return types
			void
		: NodeOutput<TOut>;

export const registerHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	node: BaseNode<TIn, TOut>,
	handler: (ctx: NodeExecutorContext<TIn, TOut>) => HandlerReturnType<TOut>,
) => genericRegisterHandler(defaultNodeHandlers, node, handler);

export const registerAsyncHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	node: BaseNode<TIn, TOut>,
	handler: (
		ctx: NodeExecutorContext<TIn, TOut>,
	) => Promise<HandlerReturnType<TOut>>,
) => genericRegisterAsyncHandler(defaultNodeHandlers, node, handler);

export const genericRegisterHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	registry: Record<
		string,
		NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
	>,
	node: BaseNode<TIn, TOut>,
	handler: (ctx: NodeExecutorContext<TIn, TOut>) => HandlerReturnType<TOut>,
) => {
	const id = `${node.category}-${node.name}`;
	if (id in registry)
		throw new Error(`a handler for node "${id}" has already been registered`);
	childLogger("nodes").debug(`\t\t-> registering handler for ${id}`);
	registry[id] = async (ctx) => {
		const result = handler(ctx as unknown as NodeExecutorContext<TIn, TOut>);
		return result === undefined ? {} : result;
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
	handler: (
		ctx: NodeExecutorContext<TIn, TOut>,
	) => Promise<HandlerReturnType<TOut>>,
) => {
	const id = `${node.category}-${node.name}`;
	if (id in registry)
		throw new Error(`a handler for node "${id}" has already been registered`);
	childLogger("nodes").debug(`\t\t-> registering handler (async) for ${id}`);
	registry[id] = async (ctx) => {
		const result = await handler(
			ctx as unknown as NodeExecutorContext<TIn, TOut>,
		);
		return result === undefined ? {} : result;
	};
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

export type IsFlow<T extends ObjectEntry> =
	"metadataType" extends keyof v.InferMetadata<T>
		? v.InferMetadata<T>["metadataType"] extends "flow"
			? true
			: false
		: false;

export type IncludeFlows<T extends v.ObjectEntries> = OmitNever<{
	[key in keyof T]: T[key] extends ReturnType<typeof flow>
		? v.InferOutput<T[key]>
		: never;
}>;

export type IncludeSubfowArguments<
	T extends v.ObjectEntries,
	TParent extends keyof IncludeFlows<T> | string = string,
> = OmitNever<{
	[key in keyof T]: "metadataType" extends keyof v.InferMetadata<T[key]>
		? v.InferMetadata<T[key]>["metadataType"] extends "subflowArgument"
			? "parent" extends keyof v.InferMetadata<T[key]>
				? v.InferMetadata<T[key]>["parent"] extends TParent
					? v.InferOutput<T[key]>
					: never
				: never
			: never
		: never;
}>;

type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };
