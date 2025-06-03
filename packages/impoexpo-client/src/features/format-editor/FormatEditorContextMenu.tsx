import {
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import {
	forwardRef,
	type MutableRefObject,
	type Ref,
	useCallback,
	useImperativeHandle,
	useState,
} from "react";
import type { ProjectNode } from "./nodes/renderable-node-types";
import { useFormatEditorStore } from "./store";
import * as htmlToImage from "html-to-image";

export type FormatEditorContextMenuRef = {
	trigger: (
		node: ProjectNode,
		position: { x: number; y: number },
		containerRef: HTMLDivElement,
	) => void;
	isOpen: () => boolean;
};
const FormatEditorContextMenu = forwardRef((props, ref) => {
	const { onNodesChange, duplicateNode, isNodeRemovable } =
		useFormatEditorStore();

	const [isOpen, setIsOpen] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [containerRef, setContainerRef] = useState<
		HTMLDivElement | undefined
	>();
	const [node, setNode] = useState<ProjectNode | undefined>();

	useImperativeHandle(ref, () => {
		return {
			trigger(
				node: ProjectNode,
				pos: { x: number; y: number },
				ref: HTMLDivElement,
			) {
				setPosition(pos);
				setNode(node);
				setContainerRef(ref);
				setIsOpen(true);
			},
			isOpen() {
				return isOpen;
			},
		};
	});

	const deleteNodeAction = useCallback(() => {
		if (!node || !isNodeRemovable) return;
		onNodesChange([{ type: "remove", id: node.id }]);
	}, [node, onNodesChange, isNodeRemovable]);

	const duplicateNodeAction = useCallback(() => {
		if (!node) return;
		duplicateNode(node.id);
	}, [node, duplicateNode]);

	const renderNodeToImageAction = useCallback(async () => {
		if (!node || !containerRef) return;
		const rect = containerRef.getBoundingClientRect();
		const data = await htmlToImage.toBlob(containerRef, {
			cacheBust: true,
			width: rect.width + 20,
			height: rect.height + 20,
			style: {
				width: `${rect.width}px`,
				height: `${rect.height}px`,
				margin: "10px",
			},
		});
		if (!data) return;
		/* await navigator.clipboard.write([
			new ClipboardItem({
				"image/png": data,
			}),
		]); */
		const dataUrl = URL.createObjectURL(data);
		const a = document.createElement("a");
		a.href = dataUrl;
		a.download = `${node.type}.png`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(dataUrl);
	}, [node, containerRef]);

	return (
		<Dropdown isOpen={isOpen} onOpenChange={setIsOpen} placement="right-start">
			<DropdownTrigger>
				<div
					className="fixed w-0 h-0 overflow-hidden pointer-events-none"
					style={{ top: position.y, left: position.x }}
				/>
			</DropdownTrigger>
			<DropdownMenu disabledKeys={isNodeRemovable(node?.id) ? [] : ["delete"]}>
				<DropdownItem
					key="render-png"
					startContent={<Icon width={18} icon="mdi:image-move" />}
					onPress={renderNodeToImageAction}
				>
					<Trans>render</Trans>
				</DropdownItem>
				<DropdownItem
					key="duplicate"
					shortcut="Ctrl+D"
					startContent={<Icon width={18} icon="mdi:content-duplicate" />}
					onPress={duplicateNodeAction}
				>
					<Trans>duplicate</Trans>
				</DropdownItem>
				<DropdownItem
					key="delete"
					shortcut="Delete"
					className="text-danger"
					color="danger"
					startContent={<Icon width={18} icon="mdi:delete" />}
					onPress={deleteNodeAction}
					description={
						isNodeRemovable(node?.id) ? undefined : (
							<p className="max-w-48">
								<Trans>
									this node cannot be removed as it's not searchable and is tied
									to an integration.
								</Trans>
							</p>
						)
					}
				>
					<Trans>delete</Trans>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
});

export default FormatEditorContextMenu;
