import AnimateChangeInSize from "@/components/external/AnimateChangeInSize";
import {
	Divider,
	Input,
	Listbox,
	ListboxItem,
	Modal,
	ModalBody,
	ModalContent,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { baseNodes, getBaseNode } from "@impoexpo/shared/nodes/node-database";
import { Trans, useLingui } from "@lingui/react/macro";
import { search, type SearchParams } from "@orama/orama";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	getNodeRenderOptions,
	useRenderableNodesStore,
} from "../../nodes/renderable-node-database";
import { useSearchNodesModalStore } from "./store";
import { useNodeSearchMetadataStore } from "../../nodes/renderable-node-database";
import useLocaleInformation from "@/hooks/useLocaleInformation";
import { useFormatEditorStore } from "../../stores/store";
import { localizableString } from "../../nodes/renderable-node-types";
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
	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<
		{
			id: string;
			score: number;
		}[]
	>([]);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		const listener = (ev: KeyboardEvent) => {
			if (ev.target === inputRef.current) return;
			inputRef.current?.focus();
			inputRef.current?.dispatchEvent(ev);
		};

		window.addEventListener("keypress", listener);
		return () => window.removeEventListener("keypress", listener);
	}, []);

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
				if (!(getNodeRenderOptions(h.id).raw.searchable ?? true)) return false;

				return Object.keys(
					fromEntry.source === "input"
						? (toNode.outputSchema?.entries ?? {})
						: (toNode.inputSchema?.entries ?? {}),
				).some((key) => entriesCompatible(fromEntry, toNode.entry(key), true));
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
									{query === "" ? (
										<ManualNodeSelector onClose={onClose} />
									) : (
										<Listbox items={searchResults} className="w-full">
											{(item) =>
												getSearchModalNodeListItem({
													id: item.id,
													score: item.score,
													onClose: onClose,
												})
											}
										</Listbox>
									)}
								</div>
							</ModalBody>
						</AnimateChangeInSize>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}

function ManualNodeSelector(props: { onClose: () => void }) {
	const BACK_LIST_ITEM_KEY = "back";

	const { categoryRenderOptions } = useRenderableNodesStore();
	const { newNodeInformation } = useSearchNodesModalStore();

	const [selectedCategory, setSelectedCategory] = useState<
		string | undefined
	>();

	const [nodes, setNodes] = useState<{ id: string }[]>([]);
	useEffect(() => {
		if (!selectedCategory) setNodes([]);
		else
			setNodes([
				...Object.values(baseNodes)
					.filter((toNode) => {
						if (
							!(
								getNodeRenderOptions(`${toNode.category}-${toNode.name}`).raw
									.searchable ?? true
							)
						)
							return false;
						if (toNode.category !== selectedCategory) return false;
						if (
							!newNodeInformation?.fromNodeType ||
							!newNodeInformation?.fromHandleId
						)
							return true;
						const fromNode = getBaseNode(newNodeInformation.fromNodeType);
						const fromEntry = fromNode.entry(newNodeInformation.fromHandleId);

						return Object.keys(
							fromEntry.source === "input"
								? (toNode.outputSchema?.entries ?? {})
								: (toNode.inputSchema?.entries ?? {}),
						).some((key) =>
							entriesCompatible(fromEntry, toNode.entry(key), true),
						);
					})
					.map((v) => ({ id: String(`${v.category}-${v.name}`) })),
				{ id: BACK_LIST_ITEM_KEY },
			]);
	}, [selectedCategory, newNodeInformation]);

	return (
		<div className="flex flex-col">
			{selectedCategory === undefined ? (
				<Listbox
					className="w-full"
					items={Object.entries(categoryRenderOptions).filter(([k]) =>
						Object.values(
							useRenderableNodesStore.getState().nodeRenderOptions,
						).some(
							(v) =>
								v.node.category === k &&
								(v.raw.searchable === undefined || v.raw.searchable),
						),
					)}
				>
					{([k, v]) => (
						<ListboxItem
							key={k}
							startContent={v.icon?.(24)}
							endContent={<Icon width={18} icon="mdi:chevron-right" />}
							onPress={() => setSelectedCategory(k)}
						>
							{localizableString(v.name)}
						</ListboxItem>
					)}
				</Listbox>
			) : (
				<Listbox className="w-full" items={nodes}>
					{(obj) => {
						if (obj.id === BACK_LIST_ITEM_KEY) {
							return (
								<ListboxItem
									key={obj.id}
									startContent={<Icon width={24} icon="mdi:chevron-left" />}
									onPress={() => setSelectedCategory(undefined)}
								>
									<Trans>go back</Trans>
								</ListboxItem>
							);
						}

						return getSearchModalNodeListItem({
							id: obj.id,
							onClose: props.onClose,
						});
					}}
				</Listbox>
			)}
			<Divider />
			<div className="flex flex-row gap-2 w-full items-center p-2">
				<Icon
					className="text-foreground-400"
					width={18}
					icon="mdi:information"
				/>
				<p className="text-tiny text-foreground-400">
					<Trans>
						the results are filtered based on what node and property you've
						selected.
					</Trans>
				</p>
			</div>
		</div>
	);
}

// blame heroui for this abomination (it always expects ListItem as a child)
const getSearchModalNodeListItem = (props: {
	id: string;
	score?: number;
	onClose: () => void;
}) => {
	const { newNodeInformation } = useSearchNodesModalStore.getState();
	const { attachNewNode, addNewNode } = useFormatEditorStore.getState();
	const { categoryRenderOptions } = useRenderableNodesStore.getState();

	const renderOptions = getNodeRenderOptions(props.id);
	const nodeData = getBaseNode(props.id);
	const categoryOptions = categoryRenderOptions[nodeData.category] || {};

	return (
		<ListboxItem
			key={props.id}
			startContent={renderOptions.raw.icon?.(24) ?? categoryOptions.icon?.(24)}
			description={
				props.score
					? `${props.id} (${Math.trunc(props.score * 100)}%)`
					: props.id
			}
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
						props.id,
						newNodeInformation.fromHandleId,
						newNodeInformation.position,
					);
				} else {
					addNewNode(props.id, newNodeInformation.position);
				}

				props.onClose();
			}}
		>
			<div className="flex flex-row items-center gap-1">
				{localizableString(categoryOptions.name)}{" "}
				<Icon icon="mdi:arrow-right" />{" "}
				{renderOptions.raw.title !== undefined
					? localizableString(renderOptions.raw.title)
					: props.id}
			</div>
		</ListboxItem>
	);
};
