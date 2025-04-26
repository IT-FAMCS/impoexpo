import * as literalNodes from "@impoexpo/shared/nodes/builtin/literals";
import { registerHandler } from "../../node-handler-utils";

// NOTE: literals weren't initially intended to added,
// but this poses an issue with generic nodes, where one would
// want to return a constant, which isn't possible without literal nodes.
registerHandler(literalNodes.BOOLEAN_NODE, (data) => ({ boolean: data.value }));
registerHandler(literalNodes.NUMBER_NODE, (data) => ({ number: data.value }));
registerHandler(literalNodes.STRING_NODE, (data) => ({ string: data.value }));
