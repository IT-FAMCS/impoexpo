// TODO: this code is awful. i don't understand it. please document it

import type { ProjectNode } from "@impoexpo/shared/schemas/project/ProjectSchema";
import type { Job } from "./job-manager";
import {
	defaultNodeHandlers,
	type NodeOutput,
	type NodeHandlerFunction,
	type ResolveEntries,
} from "./node-handler-utils";
import * as v from "valibot";
import type { ObjectEntries } from "valibot";
import { baseNodesMap } from "@impoexpo/shared/nodes/node-database";
import { childLogger } from "../logger";
import { FLOW_MARKER, isArray } from "@impoexpo/shared/nodes/node-utils";

export const getNodeHandler = (
	type: string,
	job: Job,
): NodeHandlerFunction<ObjectEntries, ObjectEntries> | undefined => {
	if (type in defaultNodeHandlers) return defaultNodeHandlers[type];
	if (type in job.customNodes) return job.customNodes[type];
	return undefined;
};

export const getFlowInformation = (
	node: ProjectNode,
): Record<string, string[]> | null => {
	const result = Object.entries(node.outputs).reduce<Record<string, string[]>>(
		(acc, cur) => {
			const flowOutputs = (cur[1].sources ?? []).filter(
				(o) => o.entry === FLOW_MARKER,
			);
			if (flowOutputs.length !== 0)
				acc[cur[0]] = flowOutputs.map((o) => o.node);
			return acc;
		},
		{},
	);
	return Object.keys(result).length === 0 ? null : result;
};

export const getFlowNodes = (nodes: ProjectNode[]): ProjectNode[] =>
	nodes.filter((n) => getFlowInformation(n));
export const getFlowNodeEntryFromPointer = (node: ProjectNode, ptr: string) => {
	const info = getFlowInformation(node);
	if (!info) return null;
	const pair = Object.entries(info).find((p) =>
		p[1].find((node) => node === ptr),
	);
	return pair ? pair[0] : null;
};

export const executeJobNodes = async (job: Job) => {
	const logger = childLogger(`jobs/${job.id}`);
	logger.level =
		process.env.VERBOSE_NODE_EXECUTOR === "true" ? "debug" : "info";

	type FlowParent = { node: ProjectNode; entry: string };
	const findFlowParent = (
		node: ProjectNode,
		nodes: ProjectNode[],
	): FlowParent | null => {
		const check = (targetNode: ProjectNode): FlowParent | null => {
			const flowNode = nodes.find((n) =>
				getFlowNodeEntryFromPointer(n, targetNode.id),
			);
			if (flowNode) {
				return {
					node: flowNode,
					// biome-ignore lint/style/noNonNullAssertion: always true if flowNode exists
					entry: getFlowNodeEntryFromPointer(flowNode, targetNode.id)!,
				};
			}

			for (const entry of Object.values(targetNode.inputs)) {
				if (entry.type === "independent" || !entry.sources) continue;
				const sourceNodes = nodes.filter((n) =>
					entry.sources?.some((s) => s.node === n.id),
				);
				for (const sourceNode of sourceNodes) {
					const parent = check(sourceNode);
					if (parent) return parent;
				}
			}

			return null;
		};
		return check(node);
	};

	type InputPath = {
		node: string;
		entry: string;
		depth: number;
		parent?: Record<string, InputPath[]>;
	};

	const resolveInputPaths = (
		node: ProjectNode,
		nodes: ProjectNode[],
		depth = 1,
	) => {
		const paths: Record<string, InputPath[]> = {};
		const base = baseNodesMap.get(node.type);
		if (!base) {
			throw new Error(`no node base was found for node type "${node.type}"`);
		}

		for (const [input, meta] of Object.entries(node.inputs)) {
			if (meta.type === "independent" || !meta.sources) continue;

			paths[input] = [];
			for (const source of meta.sources) {
				const sourceNode = nodes.find((n) => source.node === n.id);
				if (!sourceNode) continue;

				const path: InputPath = {
					node: source.node,
					entry: source.entry,
					depth: depth,
				};
				const parentPaths = resolveInputPaths(sourceNode, nodes, depth + 1);
				if (Object.keys(parentPaths).length !== 0) path.parent = parentPaths;
				paths[input].push(path);
			}
		}

		return paths;
	};

	const runNode = async (
		node: ProjectNode,
		nodes: ProjectNode[],
		paths: Record<string, InputPath[]>,
		depth?: number,
		previousData?: Record<string, NodeOutput<v.ObjectEntries>>,
	) => {
		const lookupPaths = (
			all: Record<string, InputPath[]>,
			callback: (path: InputPath) => void,
		) => {
			for (const [, paths] of Object.entries(all)) {
				for (const path of paths) {
					callback(path);
					if (path.parent) lookupPaths(path.parent, callback);
				}
			}
		};

		let actualDepth = depth ?? 0;
		const actualPreviousData: Record<
			string,
			NodeOutput<v.ObjectEntries>
		> = previousData ?? {};
		if (depth === undefined) {
			lookupPaths(paths, (path) => {
				actualDepth = Math.max(actualDepth, path.depth);
			});
		}

		logger.debug(`running ${node.id} at depth ${actualDepth}`);

		const inputPaths: InputPath[] = [];
		const pathOutputs: Record<string, NodeOutput<v.ObjectEntries>> = {};
		lookupPaths(paths, (path) => {
			if (path.depth === actualDepth && !(path.node in actualPreviousData))
				inputPaths.push(path);
		});

		const resolveInputs = (sourceNode: ProjectNode) => {
			const base = baseNodesMap.get(sourceNode.type);
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
							inputs[input] = meta.value;
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
											...(input in inputs
												? (inputs[input] as Array<unknown>)
												: []),
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

		const proxyRun = (caller: ProjectNode) => {
			return async (
				callees: string[],
				values?: NodeOutput<v.ObjectEntries>,
			) => {
				if (!getFlowInformation(caller)) {
					throw new Error(
						`${caller.id} attempted to call ~run(), which isn't allowed in non-flow nodes`,
					);
				}

				const findRootFlowParent = (
					current: FlowParent | null,
				): FlowParent | null => {
					if (current === null) return null;
					const parent = findFlowParent(current.node, nodes);
					return parent === null ? current : findRootFlowParent(parent);
				};

				for (const callee of callees) {
					const calleeNode = nodes.find((n) => n.id === callee);
					if (!calleeNode) {
						throw new Error(
							`requested to run node ${callee}, which doesn't exist in the project`,
						);
					}

					const newNodes = nodes.filter((n) => {
						if (n.id === caller.id) return false;
						const parent = findRootFlowParent(findFlowParent(n, nodes));
						const result =
							parent === null ||
							(parent.node.id === caller.id &&
								parent.entry === getFlowNodeEntryFromPointer(caller, callee));
						return result;
					});

					if (Array.isArray(values)) {
						for (const value of values) {
							actualPreviousData[caller.id] = value;
							await runNodes(newNodes, structuredClone(actualPreviousData));
						}
					} else {
						if (values !== undefined) actualPreviousData[caller.id] = values;
						await runNodes(newNodes, structuredClone(actualPreviousData));
					}
				}
			};
		};

		for (const path of inputPaths) {
			const sourceNode = nodes.find((n) => n.id === path.node);
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
				"~run": proxyRun(sourceNode),
			});
			logger.debug("received: %o", output);
			pathOutputs[sourceNode.id] = output;
		}

		if (actualDepth === 0) {
			const base = baseNodesMap.get(node.type);
			if (!base)
				throw new Error(`no node base found for node type "${node.type}"`);
			const handler = getNodeHandler(node.type, job);
			if (!handler)
				throw new Error(`no handler found for node type "${node.type}"`);

			const inputs = {
				...resolveInputs(node),
				...(getFlowInformation(node) ?? {}),
			};
			logger.debug(`calling handler for ${node.id} with inputs: %o`, inputs);
			await handler({
				...inputs,
				"~job": job,
				"~run": proxyRun(node),
			});
		} else {
			for (const [node, data] of Object.entries(pathOutputs))
				actualPreviousData[node] = data;

			await runNode(
				node,
				nodes,
				paths,
				actualDepth - 1,
				structuredClone(actualPreviousData),
			);
		}
	};

	const runNodes = async (
		nodes: ProjectNode[],
		previousData?: Record<string, NodeOutput<v.ObjectEntries>>,
	) => {
		// terminating nodes which don't depend on any flow nodes
		const independentTerminatingNodes = nodes.filter(
			(n) =>
				Object.keys(baseNodesMap.get(n.type)?.outputSchema?.entries ?? {})
					.length === 0 && findFlowParent(n, nodes) === null,
		);
		const rootFlows = nodes.filter(
			(n) => getFlowInformation(n) && findFlowParent(n, nodes) === null,
		);

		if (rootFlows.length !== 0) {
			logger.info(`running ${rootFlows.length} independent flow node(s)`);
			for (const node of rootFlows) {
				const paths = resolveInputPaths(node, nodes);
				logger.debug(`input paths for ${node.id}: %o`, paths);
				await runNode(node, nodes, paths, undefined, previousData);
			}
		}
		if (independentTerminatingNodes.length !== 0) {
			logger.info(
				`running ${independentTerminatingNodes.length} independent terminating node(s)`,
			);
			for (const node of independentTerminatingNodes) {
				const paths = resolveInputPaths(node, nodes);
				logger.debug(`input paths for ${node.id}: %o`, paths);
				await runNode(node, nodes, paths, undefined, previousData);
			}
		}
	};

	try {
		await runNodes(job.project.nodes);
		job.complete();
	} catch (err) {
		console.error(err);
		job.notify("error", `${err}`);
	}
};
