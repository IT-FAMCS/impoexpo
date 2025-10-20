import { useSettingsStore } from "@/stores/settings";
import { useFormatEditorStore } from "./store";
import { useShallow } from "zustand/react/shallow";
import {
	JsonView,
	collapseAllNested,
	darkStyles,
	defaultStyles,
} from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { useTheme } from "@heroui/use-theme";

export default function FormatEditorDebugOverlay() {
	const theme = useTheme();
	const debug = useSettingsStore((selector) => selector.editor.debug);
	const [nodes, edges, genericNodes] = useFormatEditorStore(
		useShallow((selector) => [
			selector.nodes,
			selector.edges,
			selector.genericNodes,
		]),
	);

	if (!debug) return <></>;

	return (
		<div className="fixed left-5 top-20 z-10 w-[24.75vw] h-[80vh] overflow-scroll flex flex-col bg-content1 rounded-xl p-4 gap-2">
			<p className="font-bold">nodes</p>
			<div className="[&>*]:rounded-xl [&>*]:font-mono">
				<JsonView
					data={nodes}
					clickToExpandNode
					shouldExpandNode={collapseAllNested}
					style={theme.theme === "light" ? defaultStyles : darkStyles}
				/>
			</div>
			<p className="font-bold">edges</p>
			<div className="[&>*]:rounded-xl [&>*]:font-mono">
				<JsonView
					data={edges}
					clickToExpandNode
					shouldExpandNode={collapseAllNested}
					style={theme.theme === "light" ? defaultStyles : darkStyles}
				/>
			</div>
			<p className="font-bold">generics</p>
			<div className="[&>*]:rounded-xl [&>*]:font-mono">
				<JsonView
					data={genericNodes}
					clickToExpandNode
					shouldExpandNode={collapseAllNested}
					style={theme.theme === "light" ? defaultStyles : darkStyles}
				/>
			</div>
		</div>
	);
}
