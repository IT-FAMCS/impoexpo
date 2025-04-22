import type { BaseNode } from "@impoexpo/shared/nodes/node-types";
import type * as v from "valibot";
import type { Job } from "./job-manager";

export const registerHandler = <
	TIn extends v.ObjectEntries,
	TOut extends v.ObjectEntries,
>(
	node: BaseNode<TIn, TOut>,
	handler: (
		job: Job,
		data: ResolveEntries<TIn>,
	) => ResolveEntries<TOut> | ResolveEntries<TOut>[],
) => {};

export type ResolveEntries<T extends v.ObjectEntries> = {
	[key in keyof T]: v.InferOutput<T[key]>;
};
