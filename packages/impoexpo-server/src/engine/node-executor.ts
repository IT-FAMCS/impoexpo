import type { ProjectNode } from "@impoexpo/shared/schemas/project/ProjectSchema";
import type { Job } from "./job-manager";
import {
	defaultNodeHandlers,
	type NodeHandlerFunction,
} from "./node-handler-utils";
import type { ObjectEntries } from "valibot";
type NodeOutput = ReturnType<NodeHandlerFunction<ObjectEntries, ObjectEntries>>;

export const getNodeHandler = (
	type: string,
): NodeHandlerFunction<ObjectEntries, ObjectEntries> | undefined => {
	if (type in defaultNodeHandlers) return defaultNodeHandlers[type];
	return undefined;
};

export const executeJobNodes = async (job: Job) => {
	const terminators = job.project.nodes.filter(
		(n) => n.purpose === "terminator",
	);
	if (terminators.length === 0) {
		job.terminate("no terminator nodes found; there's nothing to execute");
		return;
	}

	const resultsCache: Record<string, NodeOutput> = {};
	const resolveNodeInputs = (
		node: ProjectNode,
	): {
		inputs: Record<string, unknown>;
		generators: [string, number][];
	} => {
		const generators: [string, number][] = [];
		const inputs: Record<string, unknown> = {};

		for (const [input, meta] of Object.entries(node.inputs)) {
			switch (meta.type) {
				case "independent": {
					if (meta.value === null) {
						throw new Error(
							`input "${input}" of node "${node.id}" has an indepedent value that wasn't set`,
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
					const output = runNode(sourceNode);

					if (!meta.source.entry || !(meta.source.entry in output)) {
						throw new Error(
							`input "${input}" of node "${node.id}" is dependent but ${!meta.source.entry ? "the source entry was not set" : `the source node (${meta.source.node}) does not have an output named "${meta.source.entry}"`}`,
						);
					}

					if (Array.isArray(output)) {
						// biome-ignore lint/style/noNonNullAssertion: checked above
						inputs[input] = output.map((o) => o[meta.source!.entry]);
						generators.push([input, output.length]);
					} else {
						inputs[input] = output[meta.source.entry];
					}
					break;
				}
			}
		}

		return { inputs, generators };
	};

	const runNode = (node: ProjectNode): NodeOutput => {
		if (node.id in resultsCache) return resultsCache[node.id];

		const { inputs, generators } = resolveNodeInputs(node);
		const handler = getNodeHandler(node.type);
		if (!handler) {
			throw new Error(
				`no handler was found for node "${node.id}" (node type "${node.type}")`,
			);
		}

		const output = handler(inputs, job);
		resultsCache[node.id] = output;
		return output;
	};

	try {
		for (const node of terminators) {
			runNode(node);
		}
	} catch (err) {
		job.terminate(`${err}`);
	}
};
