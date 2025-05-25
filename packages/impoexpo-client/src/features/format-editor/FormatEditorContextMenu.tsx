import {
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import type { ProjectNode } from "./nodes/renderable-node-types";
import { useFormatEditorStore } from "./store";

export type FormatEditorContextMenuRef = {
	trigger: (node: ProjectNode, position: { x: number; y: number }) => void;
	isOpen: () => boolean;
};
const FormatEditorContextMenu = forwardRef((props, ref) => {
	const { onNodesChange, duplicateNode, isNodeRemovable } =
		useFormatEditorStore();

	const [isOpen, setIsOpen] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [node, setNode] = useState<ProjectNode | undefined>();

	useImperativeHandle(ref, () => {
		return {
			trigger(node: ProjectNode, pos: { x: number; y: number }) {
				setPosition(pos);
				setNode(node);
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
