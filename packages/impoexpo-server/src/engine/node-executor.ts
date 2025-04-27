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

export const getNodeHandler = (
	type: string,
	job: Job,
): NodeHandlerFunction<ObjectEntries, ObjectEntries> | undefined => {
	if (type in defaultNodeHandlers) return defaultNodeHandlers[type];
	if (type in job.customNodes) return job.customNodes[type];
	return undefined;
};

export const executeJobNodes = async (job: Job) => {
	const terminators = job.project.nodes.filter(
		(n) =>
			Object.keys(baseNodesMap.get(n.type)?.outputSchema?.entries ?? {})
				.length === 0,
	);
	if (terminators.length === 0) {
		job.notify(
			"error",
			"no terminator nodes found; there's nothing to execute",
		);
		return;
	}

	type InputPath = {
		node: string;
		entry: string;
		depth: number;
		parent?: Record<string, InputPath>;
	};

	const resolveInputPaths = (node: ProjectNode, depth = 1) => {
		const paths: Record<string, InputPath> = {};
		const base = baseNodesMap.get(node.type);
		if (!base) {
			throw new Error(`no node base was found for node type "${node.type}"`);
		}

		for (const [input, meta] of Object.entries(node.inputs)) {
			if (meta.type === "independent" || !meta.source) continue;

			const sourceNode = job.project.nodes.find(
				(n) => n.id === meta.source?.node,
			);
			if (!sourceNode) continue;

			const path: InputPath = {
				node: meta.source.node,
				entry: meta.source.entry,
				depth: depth,
			};
			const parentPaths = resolveInputPaths(sourceNode, depth + 1);
			if (Object.keys(parentPaths).length !== 0) path.parent = parentPaths;
			paths[input] = path;
		}

		return paths;
	};

	const runNode = async (
		node: ProjectNode,
		paths: Record<string, InputPath>,
		depth?: number,
		previousData?: Record<string, NodeOutput<v.ObjectEntries>>,
	) => {
		const lookupPaths = (
			all: Record<string, InputPath>,
			callback: (path: InputPath) => void,
		) => {
			for (const [input, path] of Object.entries(all)) {
				callback(path);
				if (path.parent) lookupPaths(path.parent, callback);
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
							if (!meta.source)
								throw new Error(
									`node "${sourceNode.id}" has a dependent input "${input}" which wasn't connected to anything`,
								);
							if (!(meta.source.node in actualPreviousData))
								throw new Error(
									`node "${sourceNode.id}" has a dependent input "${input}" connected to "${meta.source.node}", but it wasn't previously computed`,
								);
							if (Array.isArray(actualPreviousData[meta.source.node]))
								throw new Error(
									`unexpected iterator in "${meta.source.node}", which was connected to "${sourceNode.id}" (${meta.source.entry} -> ${input})`,
								);
							if (
								!(
									meta.source.entry in
									(actualPreviousData[meta.source.node] as Record<
										string,
										unknown
									>)
								)
							)
								throw new Error(
									`node "${sourceNode.id}" has a dependent input "${input}" connected to "${meta.source.node}", but it doesn't have an output named "${meta.source.entry}"`,
								);
							inputs[input] = (
								actualPreviousData[meta.source.node] as Record<string, unknown>
							)[meta.source.entry];
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

			const output = await handler(resolveInputs(sourceNode), job);
			pathOutputs[sourceNode.id] = output;
		}

		type Iterator = {
			node: string;
			length: number;
			items: ResolveEntries<v.ObjectEntries>[];
		};

		if (actualDepth === 0) {
			const base = baseNodesMap.get(node.type);
			if (!base)
				throw new Error(`no node base found for node type "${node.type}"`);
			const handler = getNodeHandler(node.type, job);
			if (!handler)
				throw new Error(`no handler found for node type "${node.type}"`);

			await handler(resolveInputs(node), job);
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

			for (const [node, data] of Object.entries(nonIterators))
				actualPreviousData[node] = data;

			if (iterators.length === 0)
				await runNode(
					node,
					paths,
					actualDepth - 1,
					structuredClone(actualPreviousData),
				);
			else {
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

				for (let idx = 0; idx < iterators[0].length; idx++) {
					for (const it of iterators)
						actualPreviousData[it.node] = it.items[idx];
					await runNode(
						node,
						paths,
						actualDepth - 1,
						structuredClone(actualPreviousData),
					);
				}
			}
		}
	};

	try {
		for (const node of terminators) {
			await runNode(node, resolveInputPaths(node));
		}
		job.complete();
	} catch (err) {
		job.notify("error", `${err}`);
	}
};
