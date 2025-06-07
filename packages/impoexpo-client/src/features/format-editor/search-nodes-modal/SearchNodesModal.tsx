import AnimateChangeInSize from "@/components/external/AnimateChangeInSize";
import {
	Chip,
	Divider,
	Input,
	Listbox,
	ListboxItem,
	Modal,
	ModalBody,
	ModalContent,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { getBaseNode } from "@impoexpo/shared/nodes/node-database";
import { useLingui } from "@lingui/react/macro";
import { search, type SearchParams } from "@orama/orama";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	getNodeRenderOptions,
	useRenderableNodesStore,
} from "../nodes/renderable-node-database";
import { useSearchNodesModalStore } from "./store";
import { useNodeSearchMetadataStore } from "../nodes/renderable-node-database";
import useLocaleInformation from "@/hooks/useLocaleInformation";
import { useFormatEditorStore } from "../store";
import { localizableString } from "../nodes/renderable-node-types";
import { entriesCompatible } from "@impoexpo/shared/nodes/node-utils";

export default function SearchNodesModal(props: {
	isOpen: boolean;
	onOpenChange: () => void;
	portal: React.MutableRefObject<HTMLDivElement>;
}) {
	const { t } = useLingui();
	const locale = useLocaleInformation();
	const { database, reset } = useNodeSearchMetadataStore();
	const { setNewNodeInformation, newNodeInformation } =
		useSearchNodesModalStore();
	const { attachNewNode, addNewNode } = useFormatEditorStore();
	const { categoryRenderOptions } = useRenderableNodesStore();
	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<
		{
			id: string;
			score: number;
		}[]
	>([]);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		reset(locale.id);
	}, [locale, reset]);

	useEffect(() => {
		if (props.isOpen) {
			if (inputRef.current) inputRef.current.focus();
			setQuery("");
		} else {
			setNewNodeInformation(undefined);
		}
	}, [props.isOpen, setNewNodeInformation]);

	useEffect(() => {
		if (!database || !props.isOpen) return;

		const params: SearchParams<typeof database> = {};
		if (query !== "") params.term = query;

		const searchResults = search(database, params, locale.fullName);
		if (searchResults instanceof Promise) return;

		const hits = searchResults.hits
			.filter((hit) => hit.score !== 0)
			.sort((left, right) => (left.score > right.score ? -1 : 1))
			.map((hit) => ({
				id: hit.document.id,
				score: hit.score,
			}))
			.filter((h) => {
				if (
					!newNodeInformation?.fromNodeType ||
					!newNodeInformation?.fromHandleId
				)
					return true;
				const fromNode = getBaseNode(newNodeInformation.fromNodeType);
				const fromEntry = fromNode.entry(newNodeInformation.fromHandleId);
				const toNode = getBaseNode(h.id);

				return Object.keys(
					fromEntry.source === "input"
						? (toNode.outputSchema?.entries ?? {})
						: (toNode.inputSchema?.entries ?? {}),
				).some((key) => entriesCompatible(fromEntry, toNode.entry(key)));
			});
		setSearchResults(hits);
	}, [database, locale, query, props.isOpen, newNodeInformation]);

	return (
		<Modal
			backdrop="blur"
			classNames={{
				backdrop: "w-full h-full absolute",
				wrapper: "w-full h-full absolute",
			}}
			portalContainer={props.portal.current}
			size="xl"
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
		>
			<ModalContent>
				{(onClose) => (
					<>
						<AnimateChangeInSize height>
							<ModalBody className="flex flex-col p-0">
								<div className="flex flex-col">
									<Input
										size="lg"
										ref={inputRef}
										value={query}
										onValueChange={setQuery}
										startContent={
											<div className="flex flex-row items-center justify-center gap-2">
												<Icon width={18} icon="mdi:search" />
											</div>
										}
										classNames={{
											inputWrapper:
												"rounded-none group-data-[focus-visible=true]:ring-0 group-data-[focus-visible=true]:ring-offset-0",
										}}
										className="w-full"
										placeholder={t`enter the name, category or tag of the needed node...`}
									/>
									<Divider />
									<Listbox items={searchResults} className="w-full">
										{(item) => {
											const renderOptions = getNodeRenderOptions(item.id);
											const nodeData = getBaseNode(item.id);

											const categoryOptions = categoryRenderOptions.get(
												nodeData.category,
											);
											if (!categoryOptions) return null;

											return (
												<ListboxItem
													onPress={() => {
														if (!newNodeInformation) return;
														if (
															newNodeInformation.fromNodeId &&
															newNodeInformation.fromNodeType &&
															newNodeInformation.fromHandleId
														) {
															attachNewNode(
																newNodeInformation.fromNodeId,
																newNodeInformation.fromNodeType,
																item.id,
																newNodeInformation.fromHandleId,
																newNodeInformation.position,
															);
														} else {
															addNewNode(item.id, newNodeInformation.position);
														}

														onClose();
													}}
													startContent={
														renderOptions.raw.icon?.(24) ??
														categoryOptions.icon?.(24)
													}
													description={`${item.id} (${Math.trunc(item.score * 100)}%)`}
												>
													<div className="flex flex-row items-center justify-center gap-1">
														{localizableString(categoryOptions.name, t)}{" "}
														<Icon icon="mdi:arrow-right" />{" "}
														{renderOptions.raw.title !== undefined
															? localizableString(renderOptions.raw.title, t)
															: item.id}
													</div>
												</ListboxItem>
											);
										}}
									</Listbox>
								</div>
							</ModalBody>
						</AnimateChangeInSize>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
