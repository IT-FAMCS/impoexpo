// TODO: this code is awful. i don't understand it. please document it

import type { ProjectNode } from "@impoexpo/shared/schemas/project/ProjectSchema";
import type { Job } from "./job-manager";
import {
	defaultNodeHandlers,
	type NodeOutput,
	type NodeHandlerFunction,
	type ResolveEntries,
	type NodeExecutorContext,
	type InputPath,
	type Iterator,
} from "./node-executor-utils";
import * as v from "valibot";
import type { ObjectEntries } from "valibot";
import { baseNodes } from "@impoexpo/shared/nodes/node-database";
import { childLogger } from "../logger";
import {
	isArray,
	isDateTime,
	unwrapNodeIfNeeded,
} from "@impoexpo/shared/nodes/node-utils";
import clone from "clone";
import { DateTime } from "luxon";

export class SkipIterationError extends Error {
	constructor() {
		super("a node handler requested to skip an iteration");
		this.name = "SkipIterationError";
	}
}

export const getNodeHandler = (
	type: string,
	job: Job,
): NodeHandlerFunction<ObjectEntries, ObjectEntries> | undefined => {
	if (type in defaultNodeHandlers) return defaultNodeHandlers[type];
	if (type in job.customNodes) return job.customNodes[type];
	return undefined;
};

export const executeJobNodes = async (job: Job) => {
	const logger = childLogger(`jobs/${job.id}`);
	logger.level =
		process.env.VERBOSE_NODE_EXECUTOR === "true" ? "debug" : "info";

	// this will be used for ~reduce
	let globalIterators: Iterator[] = [];

	const resolveInputPaths = (node: ProjectNode, depth = 1) => {
		const paths: Record<string, InputPath[]> = {};
		const base = baseNodes[node.type];
		if (!base) {
			throw new Error(`no node base was found for node type "${node.type}"`);
		}

		for (const [input, meta] of Object.entries(node.inputs)) {
			if (meta.type === "independent" || !meta.sources) continue;

			paths[input] = [];
			for (const source of meta.sources) {
				const sourceNode = job.project.nodes.find((n) => source.node === n.id);
				if (!sourceNode) continue;

				const path: InputPath = {
					node: source.node,
					entry: source.entry,
					depth: depth,
				};
				const parentPaths = resolveInputPaths(sourceNode, depth + 1);
				if (Object.keys(parentPaths).length !== 0) path.parent = parentPaths;
				paths[input].push(path);
			}
		}

		return paths;
	};

	const traversePaths = (
		all: Record<string, InputPath[]>,
		callback: (path: InputPath) => void,
	) => {
		for (const [, paths] of Object.entries(all)) {
			for (const path of paths) {
				callback(path);
				if (path.parent) traversePaths(path.parent, callback);
			}
		}
	};

	const persisted: Record<string, unknown> = {};
	const persist = <T = unknown>(key: string, initial?: T): (() => T) => {
		if (!(key in persisted) && !initial)
			throw new Error(
				`attempted to create a ~persist() store with key "${key}", but the initial value wasn't provided`,
			);
		persisted[key] ??= initial;
		return () => persisted[key] as T;
	};

	const reducerCache: Record<string, unknown> = {};
	const runNode = async (
		node: ProjectNode,
		paths: Record<string, InputPath[]>,
		depth?: number,
		previousData?: Record<string, NodeOutput<v.ObjectEntries>>,
		customHandler?: (inputs: ObjectEntries) => Promise<void>,
	) => {
		let actualDepth = depth ?? 0;
		const actualPreviousData: Record<
			string,
			NodeOutput<v.ObjectEntries>
		> = previousData ?? {};
		if (depth === undefined) {
			traversePaths(paths, (path) => {
				actualDepth = Math.max(actualDepth, path.depth);
			});
		}

		logger.debug(`running ${node.id} at depth ${actualDepth}`);

		const createIteratorsGetter = (
			node: ProjectNode,
		): NodeExecutorContext<ObjectEntries>["~iterators"] => {
			return () => {
				let currentIds = Object.values(resolveInputPaths(node))
					.flat()
					.map((p) => p.node);
				const iterators: Iterator[] = [];
				traversePaths(paths, (path) => {
					if (currentIds.includes(path.node) && path.parent) {
						const it = globalIterators.find(
							(it) =>
								Object.values(path.parent ?? {}).some((paths) =>
									paths.some((path) => it.node === path.node),
								) && iterators.find((i) => i.node === it.node) === undefined,
						);
						if (it) iterators.push(it);
						else {
							currentIds = Object.values(path.parent)
								.flat()
								.map((p) => p.node);
						}
					}
				});
				return {
					iterators: iterators.length === 0 ? undefined : iterators,
					skip: () => {
						if (iterators.length !== 0) throw new SkipIterationError();
					},
				};
			};
		};
		const createReducer = (
			node: ProjectNode,
		): NodeExecutorContext<ObjectEntries>["~reduce"] => {
			return async <T>(
				reducer: (acc: T, cur: ObjectEntries) => T,
				initial: T,
			) => {
				if (node.id in reducerCache) return reducerCache[node.id] as T;

				let current = initial;
				const paths = resolveInputPaths(node);

				const iterators: Iterator[] = [];
				traversePaths(paths, (p) => {
					const iterator = globalIterators.find((i) => i.node === p.node);
					if (iterator && !iterators.some((i) => i.node === iterator.node))
						iterators.push(iterator);
				});
				if (iterators.length === 0) {
					await runNode(
						node,
						paths,
						actualDepth - 1,
						clone(actualPreviousData),
						async (entries) => {
							current = reducer(current, entries);
						},
					);
				} else {
					for (let idx = 0; idx < iterators[0].length; idx++) {
						// literally everything has to be recalculated from scratch so
						const cleanData: Record<string, NodeOutput<v.ObjectEntries>> = {};
						for (const it of iterators) {
							cleanData[it.node] = it.items[idx];
							it.index = idx;
						}
						try {
							await runNode(
								node,
								paths,
								undefined,
								clone(cleanData),
								async (entries) => {
									current = reducer(current, entries);
								},
							);
						} catch (err) {
							if (err instanceof SkipIterationError) {
								logger.debug(
									"caught a SkipIterationError (not actually an error) inside a reducer!",
								);
							} else throw err;
						}
					}
				}

				reducerCache[node.id] = current;
				return current;
			};
		};

		const inputPaths: InputPath[] = [];
		const pathOutputs: Record<string, NodeOutput<v.ObjectEntries>> = {};
		traversePaths(paths, (path) => {
			if (path.depth === actualDepth && !(path.node in actualPreviousData))
				inputPaths.push(path);
		});

		const resolveInputs = (sourceNode: ProjectNode) => {
			const base = baseNodes[sourceNode.type];
			if (!base)
				throw new Error(`no node base found for node type ${sourceNode.type}`);

			const inputs: Record<string, unknown> = {};
			for (const [input, schema] of Object.entries(
				base.inputSchema?.entries ?? {},
			)) {
				if (input in sourceNode.inputs) {
					const meta = sourceNode.inputs[input];
					switch (meta.type) {
						case "independent": {
							if (meta.value === undefined)
								throw new Error(
									`node "${sourceNode.id}" has an independent input "${input}" which wasn't set`,
								);

							// TODO: perhaps not the best solution to hard code it but
							// it'll work for now
							if (
								isDateTime(
									unwrapNodeIfNeeded(schema, {
										nullable: true,
										optional: true,
									}),
								) &&
								typeof meta.value === "string"
							)
								inputs[input] = DateTime.fromISO(meta.value);
							else inputs[input] = meta.value;
							break;
						}
						case "dependent": {
							if (!meta.sources)
								throw new Error(
									`node "${sourceNode.id}" has a dependent input "${input}" which wasn't connected to anything`,
								);
							for (const source of meta.sources) {
								if (!(source.node in actualPreviousData))
									throw new Error(
										`node "${sourceNode.id}" has a dependent input "${input}" connected to "${source.node}", but it wasn't previously computed`,
									);
								if (Array.isArray(actualPreviousData[source.node]))
									throw new Error(
										`unexpected iterator in "${source.node}", which was connected to "${sourceNode.id}" (${source.entry} -> ${input})`,
									);
								if (
									!(
										source.entry in
										(actualPreviousData[source.node] as Record<string, unknown>)
									)
								)
									throw new Error(
										`node "${sourceNode.id}" has a dependent input "${input}" connected to "${source.node}", but it doesn't have an output named "${source.entry}"`,
									);

								const value = (
									actualPreviousData[source.node] as Record<string, unknown>
								)[source.entry];
								inputs[input] = isArray(schema)
									? [
											...(input in inputs ? (inputs[input] as unknown[]) : []),
											...(Array.isArray(value) ? value : [value]),
										]
									: value;
							}
							break;
						}
					}
				} else {
					inputs[input] = v.getDefault(schema);
				}
			}

			return inputs;
		};

		for (const path of inputPaths) {
			const sourceNode = job.project.nodes.find((n) => n.id === path.node);
			if (!sourceNode) continue;

			const handler = getNodeHandler(sourceNode.type, job);
			if (!handler)
				throw new Error(
					`no handler found for node with type "${sourceNode.type}"`,
				);

			const inputs = resolveInputs(sourceNode);
			logger.debug(`resolving node ${path.node} with inputs: %o`, inputs);
			const output = await handler({
				...resolveInputs(sourceNode),
				"~job": job,
				"~reduce": createReducer(sourceNode),
				"~iterators": createIteratorsGetter(sourceNode),
				"~persist": persist,
			});
			logger.debug("received: %o", output);
			pathOutputs[sourceNode.id] = output;
		}

		if (actualDepth === 0) {
			const base = baseNodes[node.type];
			if (!base)
				throw new Error(`no node base found for node type "${node.type}"`);
			const handler = getNodeHandler(node.type, job);
			if (!handler)
				throw new Error(`no handler found for node type "${node.type}"`);

			const inputs = resolveInputs(node);

			if (customHandler) {
				logger.debug(
					`calling custom handler (likely a reducer) for ${node.id} with inputs: %o`,
					inputs,
				);
				await customHandler(inputs as ObjectEntries);
			} else {
				logger.debug(`calling handler for ${node.id} with inputs: %o`, inputs);
				await handler({
					...inputs,
					"~job": job,
					"~reduce": createReducer(node),
					"~iterators": createIteratorsGetter(node),
					"~persist": persist,
				});
			}
		} else {
			const iterators: Iterator[] = Object.entries(pathOutputs)
				.filter((o) => Array.isArray(o[1]))
				.map((o) => [o[0], o[1] as ResolveEntries<v.ObjectEntries>[]] as const)
				.map(
					(p) =>
						({
							node: p[0],
							length: p[1].length,
							items: p[1],
							index: 0,
						}) satisfies Iterator,
				);
			const nonIterators: Record<
				string,
				ResolveEntries<v.ObjectEntries>
			> = Object.entries(pathOutputs)
				.filter((o) => iterators.find((i) => i.node === o[0]) === undefined)
				.reduce(
					(acc, out) => {
						acc[out[0]] = out[1] as ResolveEntries<v.ObjectEntries>;
						return acc;
					},
					{} as Record<string, ResolveEntries<v.ObjectEntries>>,
				);

			if (iterators.length !== 0)
				logger.debug("found iterators: %o", iterators);
			if (Object.keys(nonIterators).length !== 0)
				logger.debug("immediate values: %o", nonIterators);

			for (const [node, data] of Object.entries(nonIterators))
				actualPreviousData[node] = data;

			if (iterators.length === 0) {
				logger.debug(
					`no iterators found at depth ${actualDepth}, resolved values: %o`,
					actualPreviousData,
				);
				await runNode(
					node,
					paths,
					actualDepth - 1,
					clone(actualPreviousData),
					customHandler,
				);
			} else {
				if (
					iterators.some(
						(it, idx) =>
							iterators.findIndex((other) => other.length === it.length) !==
							idx,
					)
				) {
					throw new Error(
						"first rule of impoexpo violated: there cannot be two or more iterators of the same depth with different amounts of items",
					);
				}

				globalIterators = iterators; // this is used for ~reduce
				for (let idx = 0; idx < iterators[0].length; idx++) {
					for (const it of iterators) {
						logger.debug(
							`(depth ${actualDepth}) iterating ${it.node} (${idx + 1}/${iterators[0].length}): %o`,
							it.items[idx],
						);
						it.index = idx;
						actualPreviousData[it.node] = it.items[idx];
					}

					try {
						await runNode(
							node,
							paths,
							actualDepth - 1,
							clone(actualPreviousData),
							customHandler,
						);
					} catch (err) {
						if (err instanceof SkipIterationError) {
							logger.debug(
								"caught a SkipIterationError (not actually an error)!",
							);
						} else throw err;
					}
				}
			}
		}
	};

	try {
		const terminatingNodes = job.project.nodes.filter(
			(n) =>
				Object.keys(baseNodes[n.type]?.outputSchema?.entries ?? {}).length ===
				0,
		);
		logger.debug(`running ${terminatingNodes.length} terminating node(s)`);
		for (const node of terminatingNodes) {
			const paths = resolveInputPaths(node);
			logger.debug(`input paths for ${node.id}: %o`, paths);
			await runNode(node, paths, undefined);
		}

		job.complete();
	} catch (err) {
		console.error(err);
		job.notify("error", `${err}`);
	}
};
