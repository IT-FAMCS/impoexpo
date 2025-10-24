import {
	addToast,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownSection,
	DropdownTrigger,
	Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import type { ProjectNode } from "./nodes/renderable-node-types";
import { useFormatEditorStore } from "./stores/store";
import { useSettingsStore } from "@/stores/settings";
import * as htmlToImage from "html-to-image";

export type FormatEditorContextMenuRef = {
	trigger: (
		node: ProjectNode,
		position: { x: number; y: number },
		container: HTMLDivElement,
	) => void;
	isOpen: () => boolean;
};
const FormatEditorContextMenu = forwardRef((props, ref) => {
	const { onNodesChange, duplicateNode, isNodeRemovable } =
		useFormatEditorStore();
	const settings = useSettingsStore();

	const [isOpen, setIsOpen] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [node, setNode] = useState<ProjectNode | undefined>();
	const [container, setContainer] = useState<HTMLDivElement | undefined>();

	useImperativeHandle(ref, () => {
		return {
			trigger(
				node: ProjectNode,
				pos: { x: number; y: number },
				container: HTMLDivElement,
			) {
				setPosition(pos);
				setNode(node);
				setIsOpen(true);
				setContainer(container);
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

	const render = useCallback(async () => {
		if (!node || !container) return;
		const wrapper = document.createElement("div");
		wrapper.style.padding = "10px";
		container.parentNode?.insertBefore(wrapper, container);
		wrapper.appendChild(container);
		try {
			const data = await htmlToImage.toBlob(wrapper, {
				cacheBust: true,
				pixelRatio: 2,
			});
			return data;
		} catch (err) {
			addToast({
				color: "danger",
				title: <Trans>failed to render node</Trans>,
				description: <p className="font-mono">{`${err}`}</p>,
			});
		} finally {
			wrapper.replaceWith(...wrapper.childNodes);
		}
	}, [container, node]);

	const renderToClipboardAction = useCallback(async () => {
		const data = await render();
		if (!data) return;
		await navigator.clipboard.write([
			new ClipboardItem({
				"image/png": data,
			}),
		]);
		addToast({ color: "success", title: <Trans>ok</Trans> });
	}, [render]);

	const renderToFileAction = useCallback(async () => {
		if (!node) return;
		const data = await render();
		if (!data) return;

		const url = URL.createObjectURL(data);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${node.type}.png`;

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		addToast({ color: "success", title: <Trans>ok</Trans> });
	}, [node, render]);

	return (
		<Dropdown isOpen={isOpen} onOpenChange={setIsOpen} placement="right-start">
			<DropdownTrigger>
				<div
					className="fixed w-0 h-0 overflow-hidden pointer-events-none"
					style={{ top: position.y, left: position.x }}
				/>
			</DropdownTrigger>
			<DropdownMenu disabledKeys={isNodeRemovable(node?.id) ? [] : ["delete"]}>
				<DropdownSection showDivider={settings.developer.nodeScreenshots}>
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
										this node cannot be removed as it's not searchable and is
										tied to an integration.
									</Trans>
								</p>
							)
						}
					>
						<Trans>delete</Trans>
					</DropdownItem>
				</DropdownSection>

				{settings.developer.nodeScreenshots ? (
					<DropdownSection>
						<DropdownItem
							key="render-to-clipboard"
							startContent={
								<Icon width={18} icon="mdi:clipboard-arrow-right-outline" />
							}
							onPress={renderToClipboardAction}
						>
							<Trans>render to clipboard</Trans>
						</DropdownItem>
						<DropdownItem
							key="render-to-file"
							startContent={<Icon width={18} icon="mdi:image-outline" />}
							onPress={renderToFileAction}
						>
							<Trans>render to file</Trans>
						</DropdownItem>
					</DropdownSection>
				) : (
					<></>
				)}
			</DropdownMenu>
		</Dropdown>
	);
});

export default FormatEditorContextMenu;
