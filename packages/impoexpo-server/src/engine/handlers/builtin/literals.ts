import * as literalNodes from "@impoexpo/shared/nodes/builtin/literals";
import { registerHandler } from "../../node-executor-utils";

// NOTE: literals weren't initially intended to added,
// but this poses an issue with generic nodes, where one would
// want to return a constant, which isn't possible without literal nodes.
registerHandler(literalNodes.BOOLEAN_NODE, (ctx) => ({ boolean: ctx.value }));
registerHandler(literalNodes.NUMBER_NODE, (ctx) => ({ number: ctx.value }));
registerHandler(literalNodes.STRING_NODE, (ctx) => ({ string: ctx.value }));
