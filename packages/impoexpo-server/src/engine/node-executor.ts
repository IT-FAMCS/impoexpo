import type { ProjectNode } from "@impoexpo/shared/schemas/project/ProjectSchema";
import type { Job } from "./job-manager";
import {
	defaultNodeHandlers,
	type NodeOutput,
	type NodeHandlerFunction,
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

	const resultsCache: Record<string, NodeOutput<v.ObjectEntries>> = {};
	const resolveNodeInputs = async (
		node: ProjectNode,
	): Promise<{
		inputs: Record<string, unknown>;
		iterators: [string, number][];
	}> => {
		const iterators: [string, number][] = [];
		const inputs: Record<string, unknown> = {};

		const base = baseNodesMap.get(node.type);
		if (!base) {
			throw new Error(`no node base was found for node type "${node.type}"`);
		}
		for (const [input, schema] of Object.entries(
			base.inputSchema?.entries ?? {},
		)) {
			if (input in node.inputs) {
				const meta = node.inputs[input];
				switch (meta.type) {
					case "independent": {
						if (meta.value === null) {
							throw new Error(
								`input "${input}" of node "${node.id}" has an independent value that wasn't set`,
							);
						}
						inputs[input] = meta.value;
						break;
					}
					case "dependent": {
						const sourceNode = job.project.nodes.find(
							(n) => n.id === meta.source?.node,
						);
						if (!meta.source || !sourceNode) {
							throw new Error(
								`input "${input}" of node "${node.id}" is dependent but ${!meta.source ? "was not set" : `was pointing to an invalid node (${meta.source.node})`}`,
							);
						}
						const output = await runNode(sourceNode);

						if (Array.isArray(output)) {
							if (
								output.some(
									(o) => !meta.source?.entry || !(meta.source.entry in o),
								)
							) {
								throw new Error(
									`input "${input}" of node "${node.id}" is dependent but ${!meta.source.entry ? "the source entry was not set" : `the source node (${meta.source.node}) does not have an output named "${meta.source.entry}"`} in one of its outputs`,
								);
							}

							// biome-ignore lint/style/noNonNullAssertion: checked above
							inputs[input] = output.map((o) => o[meta.source!.entry]);
							iterators.push([input, output.length]);
						} else {
							if (!meta.source.entry || !(meta.source.entry in output)) {
								throw new Error(
									`input "${input}" of node "${node.id}" is dependent but ${!meta.source.entry ? "the source entry was not set" : `the source node (${meta.source.node}) does not have an output named "${meta.source.entry}"`}`,
								);
							}
							inputs[input] = output[meta.source.entry];
						}
						break;
					}
				}
			} else {
				inputs[input] = v.getDefault(schema);
			}
		}

		return { inputs, iterators };
	};

	const runNode = async (
		node: ProjectNode,
	): Promise<NodeOutput<v.ObjectEntries>> => {
		if (node.id in resultsCache) return resultsCache[node.id];

		const { inputs, iterators } = await resolveNodeInputs(node);
		const handler = getNodeHandler(node.type, job);
		if (!handler) {
			throw new Error(
				`no handler was found for node "${node.id}" (node type "${node.type}")`,
			);
		}

		if (iterators.length === 0) {
			const output = await handler(inputs, job);
			resultsCache[node.id] = output;
			return output;
		}
		if (
			iterators.some(([_, length]) =>
				iterators.find(([_, otherLength]) => length !== otherLength),
			)
		) {
			// "first rule violated" be so fr right now
			throw new Error(
				"first rule of impoexpo violated: there cannot be two or more iterators which output different amounts of objects",
			);
		}

		const clonedInputs = structuredClone(inputs);
		const outputs: NodeOutput<v.ObjectEntries> = [];

		for (let it = 0; it < iterators[0][1]; it++) {
			for (const [iterator, _] of iterators) {
				if (!(iterator in inputs) || !Array.isArray(inputs[iterator]))
					throw new Error("meow");
				clonedInputs[iterator] = inputs[iterator][it];
			}

			const output = await handler(clonedInputs, job);
			if (Array.isArray(output)) outputs.push(...output);
			else outputs.push(output);
		}

		resultsCache[node.id] = outputs;
		return outputs;
	};

	try {
		for (const node of terminators) {
			await runNode(node);
		}
		job.complete();
	} catch (err) {
		job.notify("error", `${err}`);
	}
};
