import {
	Chip,
	Divider,
	Input,
	Modal,
	ModalBody,
	ModalContent,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useSearchNodesModalStore } from "./store";
import {search} from '@orama/orama';
import { nodesDatabase } from "@impoexpo/shared";

export default function SearchNodesModal(props: {
	isOpen: boolean;
	onOpenChange: () => void;
	portal: React.MutableRefObject<HTMLDivElement>;
}) {
	const { setFilters, filters } = useSearchNodesModalStore();
	const [query, setQuery] = useState("");
	// biome-ignore lint/style/noNonNullAssertion: required here
	const inputRef = useRef<HTMLInputElement>(null!);
	useEffect(() => {
		if (inputRef.current && props.isOpen) inputRef.current.focus();
	}, [props.isOpen]);

	useEffect(() => {
		const searchResults = search(nodesDatabase, {
			term: query
		});
		console.log(searchResults);
	}, [query]);

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
													onClose={() => setFilters(filters.filter(tag => filter !== tag))}
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
									placeholder="введите название, категорию или тэг нужного графа..."
								/>
								<Divider />
							</div>
							<div className="p-4 h-14" />
						</ModalBody>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
