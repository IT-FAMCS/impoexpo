import {
	Background,
	type ColorMode,
	type Connection,
	Controls,
	type Edge,
	type FinalConnectionState,
	Panel,
	ReactFlow,
	getOutgoers,
	useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "../../styles/reactflow.css";
import { Button, Input, Kbd, Tooltip, useDisclosure } from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { nodeSchemasCompatible } from "./nodes/renderable-node-helpers";
import { useRenderableNodesStore } from "./nodes/renderable-node-database";
import SearchNodesModal from "./search-nodes-modal/SearchNodesModal";
import { useSearchNodesModalStore } from "./search-nodes-modal/store";
import { ThemeProps } from "@heroui/use-theme";
import { useFormatEditorStore, useFormatEditorTemporalStore } from "./store";
import useMousePosition from "../../hooks/useMousePosition";
import { Icon } from "@iconify/react";
import { useHotkeys } from "react-hotkeys-hook";
import { Trans } from "@lingui/react/macro";
import type { ProjectNode } from "./nodes/renderable-node-types";
import { useProjectStore } from "@/stores/project";
import dagre from "@dagrejs/dagre";

const connectionHasCycles = (
	connection: Connection | Edge,
	nodes: ProjectNode[],
	edges: Edge[],
): boolean => {
	const target = nodes.find((node) => node.id === connection.target);
	if (!target) return false;
	const hasCycle = (node: ProjectNode, visited = new Set()) => {
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

export default function FormatEditor(props: { doneCallback: () => void }) {
	const {
		edges,
		nodes,
		onConnect,
		onEdgesChange,
		onNodesChange,
		onReconnect,
		onReconnectStart,
		onReconnectEnd,
		onNodesDelete,
		onEdgesDelete,
		onConnectEnd,
		setNodes,
	} = useFormatEditorStore();
	const { undo, redo, futureStates, pastStates } = useFormatEditorTemporalStore(
		(state) => state,
	);

	const { screenToFlowPosition, fitView } = useReactFlow();
	const {
		onOpen: openSearchModal,
		isOpen: isSearchModalOpen,
		onOpenChange: onSearchModalOpenChange,
	} = useDisclosure({ id: "SEARCH_NODES_MODAL" });

	const { setFilters, setNewNodeInformation } = useSearchNodesModalStore();
	const nodeRenderers = useRenderableNodesStore(
		useShallow((state) => state.nodeRenderers),
	);
	// biome-ignore lint/style/noNonNullAssertion: will be initialized as soon as possible
	const containerRef = useRef<HTMLDivElement>(null!);

	const mousePosition = useMousePosition();
	useHotkeys(
		"space",
		() => {
			if (!isSearchModalOpen) {
				setFilters([]);
				setNewNodeInformation({
					position: screenToFlowPosition({
						x: mousePosition.x ?? 0,
						y: mousePosition.y ?? 0,
					}),
				});
				openSearchModal();
			}
		},
		[isSearchModalOpen, setFilters, setNewNodeInformation, openSearchModal],
	);

	useHotkeys("ctrl+z", () => undo(), [undo]);
	useHotkeys("ctrl+shift+z, ctrl+y", () => redo(), [redo]);

	const [colorMode, setColorMode] = useState<ColorMode>("light");
	useEffect(() => {
		window.addEventListener("theme-change", ((ev: CustomEvent) =>
			setColorMode(ev.detail as ColorMode)) as EventListener);
		setColorMode(
			(localStorage.getItem(ThemeProps.KEY) as ColorMode | null) ?? "light",
		);
	}, []);

	const isValidConnection = useCallback(
		(connection: Connection | Edge) =>
			nodeSchemasCompatible(connection, nodes, edges) &&
			!connectionHasCycles(connection, nodes, edges),
		[nodes, edges],
	);

	const proxyOnConnectEnd = useCallback(
		(event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
			onConnectEnd(
				event,
				connectionState,
				screenToFlowPosition,
				openSearchModal,
			);
		},
		[onConnectEnd, screenToFlowPosition, openSearchModal],
	);

	const layoutNodes = useCallback(() => {
		const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
		g.setGraph({ rankdir: "LR" });

		for (const e of edges) g.setEdge(e.source, e.target);
		for (const n of nodes) {
			g.setNode(n.id, {
				...n,
				width: n.measured?.width ?? 0,
				height: n.measured?.height ?? 0,
			});
		}
		dagre.layout(g);

		setNodes(
			nodes.map((n) => {
				const position = g.node(n.id);
				const x = position.x - (n.measured?.width ?? 0) / 2;
				const y = position.y - (n.measured?.height ?? 0) / 2;
				return { ...n, position: { x, y } };
			}),
		);

		fitView();
	}, [nodes, edges, fitView, setNodes]);

	return (
		<div ref={containerRef} className="w-full h-full">
			<ReactFlow
				nodes={nodes}
				nodeTypes={nodeRenderers}
				edges={edges}
				proOptions={{ hideAttribution: true }}
				colorMode={colorMode}
				deleteKeyCode={["Delete", "Backspace"]}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onConnectEnd={proxyOnConnectEnd}
				onReconnect={onReconnect}
				onReconnectStart={onReconnectStart}
				onReconnectEnd={onReconnectEnd}
				onNodesDelete={onNodesDelete}
				onEdgesDelete={onEdgesDelete}
				isValidConnection={isValidConnection}
			>
				<Controls />
				<Background size={2} />
				<Panel position="top-right">
					<Tooltip content={<Trans>layout nodes</Trans>}>
						<Button
							onPress={layoutNodes}
							isIconOnly
							startContent={<Icon width={18} icon="mdi:stars" />}
						/>
					</Tooltip>
				</Panel>
				<Panel position="top-left">
					<div className="flex flex-row gap-2">
						{/* TODO */}
						<Input value="untitled" />
						<Tooltip
							delay={500}
							content={
								<div className="flex flex-row items-center justify-center gap-2 p-1">
									<Trans>undo</Trans>
									<Kbd keys={["ctrl"]}>Z</Kbd>
								</div>
							}
						>
							<Button
								onPress={() => undo()}
								isIconOnly
								isDisabled={pastStates.length === 0}
								startContent={<Icon width={18} icon="mdi:undo" />}
							/>
						</Tooltip>
						<Tooltip
							delay={500}
							content={
								<div className="flex flex-row items-center justify-center gap-2 p-1">
									<Trans>redo</Trans>
									<Kbd keys={["ctrl", "shift"]}>Z</Kbd>
								</div>
							}
						>
							<Button
								onPress={() => redo()}
								isIconOnly
								isDisabled={futureStates.length === 0}
								startContent={<Icon width={18} icon="mdi:redo" />}
							/>
						</Tooltip>
					</div>
				</Panel>
				<Panel position="bottom-right">
					<div className="flex flex-row gap-2">
						<Button
							size="lg"
							className="text-lg gap-2 items-center"
							color="primary"
							variant="shadow"
							endContent={<Icon width={20} icon="mdi:arrow-right" />}
							onPress={async () => {
								useProjectStore.getState().collectNodes();
								await useProjectStore.getState().collectIntegrations();
								props.doneCallback();
							}}
						>
							<Trans>done</Trans>
						</Button>
					</div>
				</Panel>
			</ReactFlow>
			<SearchNodesModal
				portal={containerRef}
				isOpen={isSearchModalOpen}
				onOpenChange={onSearchModalOpenChange}
			/>
		</div>
	);
}
