import {
	Background,
	type ColorMode,
	type Connection,
	Controls,
	type Edge,
	type FinalConnectionState,
	type Node,
	ReactFlow,
	getOutgoers,
	useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./nodes/builtin/console";
import { useDisclosure } from "@heroui/react";
import { baseNodesMap } from "@impoexpo/shared/nodes/node-database";
import { unwrapNodeIfNeeded } from "@impoexpo/shared/nodes/node-utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
	getHandleSchema,
	getHandleType,
	nodeSchemasCompatible,
} from "./nodes/node-schema-helpers";
import { useRenderableNodesStore } from "./nodes/renderable-node-types";
import SearchNodesModal from "./search-nodes-modal/SearchNodesModal";
import { useSearchNodesModalStore } from "./search-nodes-modal/store";
import { ThemeProps } from "@heroui/use-theme";
import { useFormatEditorStore } from "./store";

const connectionHasCycles = (
	connection: Connection | Edge,
	nodes: Node[],
	edges: Edge[],
): boolean => {
	const target = nodes.find((node) => node.id === connection.target);
	if (!target) return false;
	const hasCycle = (node: Node, visited = new Set()) => {
		if (visited.has(node.id)) return false;

		visited.add(node.id);

		for (const outgoer of getOutgoers(node, nodes, edges)) {
			if (outgoer.id === connection.source) return true;
			if (hasCycle(outgoer, visited)) return true;
		}

		return false;
	};

	if (target.id === connection.source) return false;
	return hasCycle(target);
};

export default function FormatEditor() {
	const [
		edges,
		nodes,
		onConnect,
		onEdgesChange,
		onNodesChange,
		onReconnect,
		onReconnectStart,
		onReconnectEnd,
	] = useFormatEditorStore(
		useShallow((s) => [
			s.edges,
			s.nodes,
			s.onConnect,
			s.onEdgesChange,
			s.onNodesChange,
			s.onReconnect,
			s.onReconnectStart,
			s.onReconnectEnd,
		]),
	);

	const {
		onOpen: openSearchModal,
		isOpen: isSearchModalOpen,
		onOpenChange: onSearchModalOpenChange,
	} = useDisclosure({ id: "SEARCH_NODES_MODAL" });

	const { setFilters } = useSearchNodesModalStore();
	const nodeRenderers = useRenderableNodesStore(
		useShallow((state) => state.nodeRenderers),
	);
	// biome-ignore lint/style/noNonNullAssertion: will be initialized as soon as possible
	const containerRef = useRef<HTMLDivElement>(null!);

	const [colorMode, setColorMode] = useState<ColorMode>("light");
	useEffect(() => {
		window.addEventListener("theme-change", ((ev: CustomEvent) =>
			setColorMode(ev.detail as ColorMode)) as EventListener);
		setColorMode(
			(localStorage.getItem(ThemeProps.KEY) as ColorMode | null) ?? "light",
		);
	}, []);

	const isValidConnection = useCallback(
		(connection: Connection | Edge) => {
			if (!nodeSchemasCompatible(connection, nodes)) return false;
			return !connectionHasCycles(connection, nodes, edges);
		},
		[nodes, edges],
	);

	const onConnectEnd = useCallback(
		(event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
			if (
				!connectionState.isValid &&
				connectionState.fromNode?.type &&
				connectionState.fromHandle?.id
			) {
				// biome-ignore lint/style/noNonNullAssertion: guaranteed to exist here
				const node = baseNodesMap.get(connectionState.fromNode.type)!;
				const handleId = connectionState.fromHandle.id;
				const handle = unwrapNodeIfNeeded(getHandleSchema(node, handleId));
				setFilters([
					`${getHandleType(node, handleId) === "input" ? "outputs" : "accepts"}:${handle.expects}`,
				]);
				openSearchModal();

				/* const id = getId();
				const { clientX, clientY } =
					"changedTouches" in event ? event.changedTouches[0] : event; */
				/* const newNode = {
				id,
				position: screenToFlowPosition({
					x: clientX,
					y: clientY,
				}),
				data: { label: `Node ${id}` },
				origin: [0.5, 0.0],
			}; */
				/*  */
			}
		},
		[openSearchModal, setFilters],
	);

	return (
		<div ref={containerRef} className="w-full h-full">
			<ReactFlow
				nodes={nodes}
				nodeTypes={nodeRenderers}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onConnectEnd={onConnectEnd}
				onReconnect={onReconnect}
				onReconnectStart={onReconnectStart}
				onReconnectEnd={onReconnectEnd}
				isValidConnection={isValidConnection}
				proOptions={{ hideAttribution: true }}
				colorMode={colorMode}
			>
				<Controls showFitView={false} />
				<Background size={2} />
			</ReactFlow>
			<SearchNodesModal
				portal={containerRef}
				isOpen={isSearchModalOpen}
				onOpenChange={onSearchModalOpenChange}
			/>
		</div>
	);
}
