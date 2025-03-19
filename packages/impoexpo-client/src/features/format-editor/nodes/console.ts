import { nodes } from "@impoexpo/shared";
import { registerWithDefaultRenderer } from "./renderable-node-types";

registerWithDefaultRenderer(nodes.base.console.CONSOLE_WRITE_NODE);
