import { nodes, nodesScope } from "@impoexpo/shared";
import {
	registerCategoryIconRenderer,
	registerWithDefaultRenderer,
} from "./renderable-node-types";
import { Icon } from "@iconify/react";

nodesScope(() => {
	registerWithDefaultRenderer(nodes.base.console.CONSOLE_WRITE_NODE);
	registerCategoryIconRenderer("console", <Icon icon="mdi:console" />);
});
