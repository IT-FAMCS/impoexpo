import type { ProjectNode } from "@impoexpo/shared/schemas/project/ProjectSchema";
import type { Job } from "./job-manager";
import {
	defaultNodeHandlers,
	type NodeOutput,
	type NodeHandlerFunction,
} from "./node-handler-utils";
import type * as v from "valibot";
import type { ObjectEntries } from "valibot";

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
		(n) => n.purpose === "terminator",
	);
	if (terminators.length === 0) {
		job.terminate("no terminator nodes found; there's nothing to execute");
		return;
	}

	const resultsCache: Record<string, NodeOutput<v.ObjectEntries>> = {};
	const resolveNodeInputs = async (
		node: ProjectNode,
	): Promise<{
		inputs: Record<string, unknown>;
		generators: [string, number][];
	}> => {
		const generators: [string, number][] = [];
		const inputs: Record<string, unknown> = {};

		for (const [input, meta] of Object.entries(node.inputs)) {
			switch (meta.type) {
				case "independent": {
					if (meta.value === null) {
						throw new Error(
							`input "${input}" of node "${node.id}" has an independent value that wasn't set`,
						);
					}
					if (node.purpose === "generator") {
						inputs[input] = meta.value;
						generators.push([input, 1]);
					} else inputs[input] = meta.value;
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
						inputs[input] =
							output.length === 1
								? // biome-ignore lint/style/noNonNullAssertion: checked above
									output[0][meta.source!.entry]
								: // biome-ignore lint/style/noNonNullAssertion: checked above
									output.map((o) => o[meta.source!.entry]);
						generators.push([input, output.length]);
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
		}

		return { inputs, generators };
	};

	const runNode = async (
		node: ProjectNode,
	): Promise<NodeOutput<v.ObjectEntries>> => {
		if (node.id in resultsCache) return resultsCache[node.id];

		const { inputs, generators } = await resolveNodeInputs(node);
		const handler = getNodeHandler(node.type, job);
		if (!handler) {
			throw new Error(
				`no handler was found for node "${node.id}" (node type "${node.type}")`,
			);
		}

		if (generators.length === 0) {
			const output = await handler(inputs, job);
			resultsCache[node.id] = output;
			return output;
		}
		if (generators.filter((g) => Array.isArray(g)).length > 1) {
			// TODO: terminate, this is one of the "rules" on impoexpo:
			// "there cannot be two or more generators which output more than one value."
		}

		const iterableGenerator = generators.find((g) => g[1] > 1)?.[0];
		if (iterableGenerator) {
			const otherGenerators = generators.filter(
				(g) => g[0] !== iterableGenerator,
			);
			if (!Array.isArray(inputs[iterableGenerator])) {
				throw new Error("meow");
			}

			const clonedInputs = structuredClone(inputs);
			for (const [id] of otherGenerators) {
				console.log(inputs, inputs[id]);
				clonedInputs[id] = inputs[id];
			}

			const outputs: NodeOutput<v.ObjectEntries> = [];
			for (const item of inputs[iterableGenerator]) {
				clonedInputs[iterableGenerator] = item;
				const output = await handler(clonedInputs, job);
				if (Array.isArray(output)) outputs.push(...output);
				else outputs.push(output);
			}
			resultsCache[node.id] = outputs;
			return outputs;
		}
		// biome-ignore lint/style/noUselessElse: not removed for clarity
		else {
			const clonedInputs = structuredClone(inputs);
			for (const [id] of generators) clonedInputs[id] = inputs[id];

			const output = await handler(clonedInputs, job);
			resultsCache[node.id] = output;
			return output;
		}
	};

	try {
		for (const node of terminators) {
			runNode(node);
		}
	} catch (err) {
		job.terminate(`${err}`);
	}
};
