import {
	getBaseNode,
	registerBaseNodes,
	unregisterBaseNodes,
} from "@impoexpo/shared/nodes/node-database";
import {
	type Node,
	type Edge,
	type OnNodesChange,
	type OnEdgesChange,
	type OnConnect,
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	type OnReconnect,
	type HandleType,
	reconnectEdge,
	getConnectedEdges,
	type FinalConnectionState,
	type ReactFlowInstance,
} from "@xyflow/react";
import { createResettable, WIZARD_STORE_CATEGORY } from "@/stores/resettable";
import { persistStoreOnReload } from "@/stores/hot-reload";
import {
	type DefaultBaseNode,
	findCompatibleEntry,
	isArray,
	isNullable,
} from "@impoexpo/shared/nodes/node-utils";
import {
	BaseNode,
	type BaseNodeEntry,
	type ObjectEntry,
} from "@impoexpo/shared/nodes/node-types";
import { deepCopy } from "deep-copy-ts";
import {
	getNodeRenderOptions,
	registerWithDefaultRenderer,
	useRenderableNodesStore,
} from "./nodes/renderable-node-database";
import type { DefaultNodeRenderOptions } from "./nodes/renderable-node-types";
import { useSearchNodesModalStore } from "./search-nodes-modal/store";
import { temporal, type TemporalState } from "zundo";
import { deepEqual } from "fast-equals";
import { useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

const nodeCount: Map<string, number> = new Map();
export const getNodeId = (type: string) => {
	if (!nodeCount.has(type)) nodeCount.set(type, 0);
	// biome-ignore lint/style/noNonNullAssertion: checked on the line above
	const next = nodeCount.get(type)! + 1;
	nodeCount.set(type, next);
	return `${type}-${next}`;
};

export type FormatEditorStore = {
	nodes: Node[];
	edges: Edge[];
	onNodesChange: OnNodesChange<Node>;
	onEdgesChange: OnEdgesChange;
	onConnect: OnConnect;
	onConnectEnd: (
		event: MouseEvent | TouchEvent,
		connectionState: FinalConnectionState,
		screenToFlowPosition: ReactFlowInstance<Node, Edge>["screenToFlowPosition"],
		openSearchModal: () => void,
	) => void;
	setNodes: (nodes: Node[]) => void;
	setEdges: (edges: Edge[]) => void;
	onNodesDelete: (nodes: Node[]) => void;
	onEdgesDelete: (edges: Edge[]) => void;
	isReconnecting: boolean;
	onReconnect: OnReconnect;
	onReconnectStart: () => void;
	onReconnectEnd: (
		event: MouseEvent | TouchEvent,
		edge: Edge,
		handle: HandleType,
	) => void;

	attachNewNode: (
		fromNodeId: string,
		fromNodeType: string,
		toNodeType: string,
		fromHandleId: string,
		position: { x: number; y: number },
	) => void;
	addNewNode: (type: string, position: { x: number; y: number }) => void;
	resolveGenericNode: (
		base: {
			node: DefaultBaseNode;
			options: DefaultNodeRenderOptions;
		},
		resolvedEntry: BaseNodeEntry,
		resolver: {
			type: string;
			schema: ObjectEntry;
		},
		node: Node,
	) => Node;
	getBaseNodeFromId: (id: string) => DefaultBaseNode | undefined;
};

type PartializedFormatEditorState = Pick<FormatEditorStore, "nodes" | "edges">;

export const useFormatEditorStore = createResettable<FormatEditorStore>(
	WIZARD_STORE_CATEGORY,
)(
	temporal(
		immer((set, get) => ({
			nodes: [],
			edges: [],

			onNodesChange: (changes) => {
				set({
					nodes: applyNodeChanges(changes, get().nodes),
				});
			},
			onEdgesChange: (changes) => {
				set({
					edges: applyEdgeChanges(changes, get().edges),
				});
			},
			onConnect: (connection) => {
				set({
					edges: addEdge(connection, get().edges),
				});
			},
			setNodes: (nodes) => {
				set({ nodes });
			},
			setEdges: (edges) => {
				set({ edges });
			},

			isReconnecting: false,
			onReconnectStart() {
				set({ isReconnecting: true });
			},
			onReconnectEnd(_, edge) {
				if (get().isReconnecting) {
					set((state) => {
						state.onEdgesDelete([edge]);
						return {
							edges: state.edges.filter((e) => e.id !== edge.id),
							isReconnecting: false,
						};
					});
				}
			},
			onReconnect(oldEdge, newConnection) {
				set(() => ({
					isReconnecting: false,
					edges: reconnectEdge(oldEdge, newConnection, get().edges),
				}));
			},

			onConnectEnd: (
				event: MouseEvent | TouchEvent,
				connectionState: FinalConnectionState,
				screenToFlowPosition: ReactFlowInstance<
					Node,
					Edge
				>["screenToFlowPosition"],
				openSearchModal: () => void,
			) => {
				const { setFilters, setNewNodeInformation } =
					useSearchNodesModalStore.getState();

				if (
					!connectionState.isValid &&
					connectionState.fromNode?.type &&
					connectionState.fromHandle?.id &&
					!get().isReconnecting
				) {
					const node = getBaseNode(connectionState.fromNode.type);
					const handleId = connectionState.fromHandle.id;
					const handle = node.entry(handleId);

					const filters = [
						`${handle.source === "input" ? "outputs" : "accepts"}${handle.generic ? "" : `:${handle.type}`}`,
					];
					if (!handle.generic)
						filters.push(
							`${handle.source === "input" ? "outputs" : "accepts"}:generic`,
						);
					setFilters(filters);

					const { clientX, clientY } =
						"changedTouches" in event ? event.changedTouches[0] : event;
					setNewNodeInformation({
						position: screenToFlowPosition({
							x: clientX,
							y: clientY,
						}),
						fromNodeId: connectionState.fromNode.id,
						fromHandleId: connectionState.fromHandle.id,
						fromNodeType: connectionState.fromNode.type,
					});
					openSearchModal();
				} else if (
					connectionState.isValid &&
					connectionState.fromNode?.type &&
					connectionState.toNode?.type &&
					connectionState.fromHandle?.id &&
					connectionState.toHandle?.id
				) {
					const fromNode = getBaseNode(connectionState.fromNode.type);
					const toNode = getBaseNode(connectionState.toNode.type);
					const fromEntry = fromNode.entry(connectionState.fromHandle.id);
					const toEntry = toNode.entry(connectionState.toHandle.id);

					const affectedNode = fromEntry.generic
						? connectionState.fromNode
						: toEntry.generic
							? connectionState.toNode
							: undefined;
					let newNode: Node | undefined;
					if (!affectedNode) return;

					if (fromEntry.generic) {
						newNode = get().resolveGenericNode(
							{
								node: fromNode,
								options: getNodeRenderOptions(connectionState.fromNode.type),
							},
							fromEntry,
							toEntry,
							connectionState.fromNode,
						);
					} else if (toEntry.generic) {
						newNode = get().resolveGenericNode(
							{
								node: toNode,
								options: getNodeRenderOptions(connectionState.toNode.type),
							},
							toEntry,
							fromEntry,
							connectionState.toNode,
						);
					}
					if (!newNode) return;

					set((state) => ({
						nodes: state.nodes.map((n) =>
							n.id === affectedNode.id ? newNode : n,
						),
					}));
				}
			},

			onEdgesDelete(edges) {
				for (const edge of edges) {
					if (!edge.sourceHandle || !edge.targetHandle) continue;
					const { isGeneric, genericNodes } =
						useRenderableNodesStore.getState();

					const source = get().getBaseNodeFromId(edge.source);
					const target = get().getBaseNodeFromId(edge.target);

					if (!source || !target || (!isGeneric(source) && !isGeneric(target)))
						return;

					const checkNode = (id: string, node: DefaultBaseNode) => {
						if (!isGeneric(node)) return;

						// biome-ignore lint/style/noNonNullAssertion: why wouldn't it exist
						const affectedNode: Node = get().nodes.find((n) => n.id === id)!;
						const base: DefaultBaseNode =
							genericNodes[`${node.category}-${node.name}`].base;

						const connectedEdges = getConnectedEdges(
							get().nodes,
							get().edges,
						).filter(
							(e) =>
								(e.target === affectedNode.id ||
									e.source === affectedNode.id) &&
								e.id !== edge.id,
						);

						// if there are any other nodes connected to generic fields of this node, DO NOT reset the node
						if (
							connectedEdges.some(
								(e) =>
									e.targetHandle &&
									base.hasEntry(e.targetHandle) &&
									base.entry(e.targetHandle).generic,
							) ||
							connectedEdges.some(
								(e) =>
									e.sourceHandle &&
									base.hasEntry(e.sourceHandle) &&
									base.entry(e.sourceHandle).generic,
							)
						)
							return;

						set((state) => ({
							nodes: state.nodes.map((n) =>
								n.id === affectedNode.id
									? { ...affectedNode, type: `${base.category}-${base.name}` }
									: n,
							),
						}));
					};

					checkNode(edge.source, source);
					checkNode(edge.target, target);
				}
			},

			onNodesDelete(nodes) {
				const {
					isGeneric,
					removeGenericNodeInstance,
					unregisterRenderOptions,
				} = useRenderableNodesStore.getState();
				const newNodes = get().nodes.filter((n) => nodes.indexOf(n) === -1);

				for (const node of nodes) {
					const data = get().getBaseNodeFromId(node.id);
					if (!data || !node.type || !isGeneric(data)) continue;
					if (!newNodes.some((n) => n.type === node.type)) {
						removeGenericNodeInstance(node.type);
						unregisterRenderOptions(node.type);
						unregisterBaseNodes(getBaseNode(node.type));
					}
				}
			},

			getBaseNodeFromId: (id) => {
				const type = get().nodes.find((n) => n.id === id)?.type;
				if (!type) return undefined;
				return getBaseNode(type);
			},

			addNewNode(type, position) {
				const id = getNodeId(type);
				const newNode = {
					id: id,
					position: position,
					data: {},
					type: type,
				} satisfies Node;
				set(() => ({
					nodes: get().nodes.concat(newNode),
				}));
			},

			attachNewNode(
				fromNodeId,
				fromNodeType,
				toNodeType,
				fromHandleId,
				position,
			) {
				const fromData = getBaseNode(fromNodeType);
				const toData = getBaseNode(toNodeType);

				const fromEntry = fromData.entry(fromHandleId);
				const toEntry = findCompatibleEntry(fromData, fromHandleId, toData);
				const id = getNodeId(toNodeType);

				let newNode: Node = {
					id: id,
					position: position,
					data: {},
					type: toNodeType,
				};

				if (toEntry.generic) {
					newNode = get().resolveGenericNode(
						{
							node: toData,
							options: getNodeRenderOptions(
								`${toData.category}-${toData.name}`,
							),
						},
						toEntry,
						{
							schema: fromEntry.schema,
							type: fromEntry.type,
						},
						newNode,
					);
				} else if (fromEntry.generic) {
					newNode = get().resolveGenericNode(
						{
							node: fromData,
							options: getNodeRenderOptions(
								`${fromData.category}-${fromData.name}`,
							),
						},
						fromEntry,
						{
							schema: toEntry.schema,
							type: toEntry.type,
						},
						newNode,
					);
				}

				set(() => ({
					nodes: get().nodes.concat(newNode),
					edges: get().edges.concat(
						fromEntry.source === "output"
							? {
									id: id,
									source: fromNodeId,
									sourceHandle: fromHandleId,
									target: id,
									targetHandle: toEntry.name,
								}
							: {
									id: id,
									source: id,
									sourceHandle: toEntry.name,
									target: fromNodeId,
									targetHandle: fromHandleId,
								},
					),
				}));
			},

			resolveGenericNode(base, resolvedEntry, resolver, node) {
				const resolvedType = resolvedEntry.generic;
				if (!resolvedType) return node;

				const copy = deepCopy(base.node);
				Object.setPrototypeOf(copy, BaseNode.prototype);

				copy.name = `${base.node.name}-${base.node.genericTypes
					.map((p) => (p === resolvedType ? resolver.type : p))
					.join("-")}`;

				// TODO: should this be here or in BaseNode?
				const simplifyResolver = (
					entry: ObjectEntry,
					resolver: ObjectEntry,
				): ObjectEntry => {
					if (isArray(entry) && isArray(resolver))
						return simplifyResolver(entry.item, resolver.item);
					if (isNullable(entry) && isNullable(resolver))
						return simplifyResolver(entry.wrapped, resolver.wrapped);
					return resolver;
				};

				copy.resolveGenericType(
					resolvedType,
					simplifyResolver(resolvedEntry.schema, resolver.schema),
				);
				copy.genericTypes = copy.genericTypes.filter((t) => t !== resolvedType);

				const { addGenericNodeInstance } = useRenderableNodesStore.getState();
				addGenericNodeInstance(base.node, copy);
				registerBaseNodes(copy);
				registerWithDefaultRenderer(copy, {
					...base.options.raw,
					searchable: false,
				});

				return { ...node, type: `${copy.category}-${copy.name}` };
			},
		})),
		{
			partialize: (state) => ({
				nodes: state.nodes,
				edges: state.edges,
			}),
			limit: 100,
			equality: (past, current) => {
				const filtered = (data: { nodes: Node[]; edges: Edge[] }) => ({
					nodes: data.nodes.map((n) => ({
						id: n.id,
						type: n.type,
						data: n.data,
					})),
					edges: data.edges.map((e) => ({
						id: e.id,
						source: e.source,
						sourceHandle: e.sourceHandle,
						target: e.target,
						targetHandle: e.targetHandle,
						data: e.data,
					})),
				});
				return deepEqual(filtered(past), filtered(current));
			},
		},
	),
);

export function useFormatEditorTemporalStore<T>(
	selector: (state: TemporalState<PartializedFormatEditorState>) => T,
) {
	return useStore(useFormatEditorStore.temporal, selector);
}

persistStoreOnReload("formatEditorStore", useFormatEditorStore);
