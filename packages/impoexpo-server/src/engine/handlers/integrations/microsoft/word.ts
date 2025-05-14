import {
	type NodeHandlerFunction,
	registerIntegrationNodeHandlerRegistrar,
} from "../../../node-handler-utils";
import type * as v from "valibot";

registerIntegrationNodeHandlerRegistrar("microsoft-word", (project) => {
	const handlers: Record<
		string,
		NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
	> = {};

	return handlers;
});
