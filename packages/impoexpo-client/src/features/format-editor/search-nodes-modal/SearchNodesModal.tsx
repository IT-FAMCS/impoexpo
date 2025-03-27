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
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useSearchNodesModalStore } from "./store";
import { search } from "@orama/orama";
import { nodesDatabase } from "../nodes/node-database";
import { useRenderableNodesStore } from "../nodes/renderable-node-types";
import { baseNodesMap } from "@impoexpo/shared/nodes/node-database";
import AnimateChangeInSize from "@/components/external/AnimateChangeInSize";
import { useLingui } from "@lingui/react/macro";

export default function SearchNodesModal(props: {
	isOpen: boolean;
	onOpenChange: () => void;
	portal: React.MutableRefObject<HTMLDivElement>;
}) {
	const { t } = useLingui();
	const { setFilters, filters } = useSearchNodesModalStore();
	const { nodeRenderOptions, categoryRenderOptions } =
		useRenderableNodesStore();
	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<
		{
			id: string;
			score: number;
		}[]
	>([]);
	// biome-ignore lint/style/noNonNullAssertion: required here
	const inputRef = useRef<HTMLInputElement>(null!);
	useEffect(() => {
		if (props.isOpen) {
			if (inputRef.current) inputRef.current.focus();
			setQuery("");
		}
	}, [props.isOpen]);

	useEffect(() => {
		const searchResults = search(
			nodesDatabase,
			{
				term: query,
				where: filters.length === 0 ? {} : { tags: filters },
			},
			"russian",
		); // TODO
		if (searchResults instanceof Promise) return;

		setSearchResults(
			searchResults.hits
				.filter((hit) => hit.score !== 0)
				.sort((left, right) => (left.score > right.score ? -1 : 1))
				.map((hit) => ({
					id: hit.document.id,
					score: hit.score,
				})),
		);
	}, [query, filters]);

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
												{filters.map((filter) => (
													<Chip
														onClose={() =>
															setFilters(
																filters.filter((tag) => filter !== tag),
															)
														}
														key={filter}
														color="primary"
														variant="solid"
													>
														{filter}
													</Chip>
												))}
											</div>
										}
										classNames={{ inputWrapper: "rounded-none" }}
										className="w-full ring-0"
										placeholder={t`enter the name, category or tag of the needed node...`}
									/>
									<Divider />
									<Listbox items={searchResults} className="w-full">
										{(item) => {
											const renderOptions = nodeRenderOptions.get(item.id);
											const nodeData = baseNodesMap.get(item.id);
											if (!renderOptions || !nodeData) return null;
											const categoryOptions = categoryRenderOptions.get(
												nodeData.category,
											);
											if (!categoryOptions) return null;

											return (
												<ListboxItem
													startContent={(
														renderOptions.categoryIcon ?? categoryOptions.icon
													)(24)}
													description={`${item.id} (${Math.trunc(item.score * 100)}%)`}
												>
													<div className="flex flex-row items-center justify-center gap-1">
														{t(categoryOptions.name)}{" "}
														<Icon icon="mdi:arrow-right" />{" "}
														{renderOptions.title !== undefined
															? t(renderOptions.title)
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
