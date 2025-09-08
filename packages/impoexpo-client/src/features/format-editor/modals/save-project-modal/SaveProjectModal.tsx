import { getExistingGroups, saveNewLocalProject } from "@/db/local-projects";
import { useProjectStore } from "@/stores/project";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	Input,
	Autocomplete,
	AutocompleteItem,
	addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";

export default function SaveProjectModal(props: {
	isOpen: boolean;
	onOpenChange: () => void;
	onClose: () => void;
}) {
	const [name, setName] = useState("");
	const [group, setGroup] = useState("");
	const [groups, setGroups] = useState<{ name: string }[]>([]);
	const { setLocalProjectId } = useProjectStore();

	useEffect(() => {
		if (props.isOpen)
			getExistingGroups().then((gr) => setGroups(gr.map((g) => ({ name: g }))));
	}, [props.isOpen]);

	return (
		<Modal
			backdrop="blur"
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
		>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className="pb-2 gap-2 items-center">
							<Icon width={24} icon="mdi:content-save" />
							<Trans>save project</Trans>
						</ModalHeader>
						<ModalBody>
							<Input
								value={name}
								onValueChange={setName}
								label={<Trans>project name</Trans>}
								isRequired
							/>
							<Autocomplete
								value={group}
								onValueChange={setGroup}
								allowsCustomValue
								items={groups}
								label={<Trans>group (optional)</Trans>}
							>
								{(item) => (
									<AutocompleteItem
										onPress={() => setGroup(item.name)}
										key={item.name}
									>
										{item.name}
									</AutocompleteItem>
								)}
							</Autocomplete>
						</ModalBody>
						<ModalFooter className="pt-2">
							<Button color="danger" variant="light" onPress={onClose}>
								<Trans>cancel</Trans>
							</Button>
							<Button
								onPress={async () => {
									const id = await saveNewLocalProject(
										name,
										group === "" ? undefined : group,
									);
									setLocalProjectId(id);

									onClose();
									addToast({
										color: "success",
										title: <Trans>successfully saved the project</Trans>,
									});
								}}
								disabled={name === ""}
								color="primary"
							>
								<Trans>save</Trans>
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
