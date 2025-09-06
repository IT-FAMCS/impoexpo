import {
	Alert,
	Button,
	Card,
	CardBody,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useLingui, Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import {
	getAllLocalProjects,
	removeLocalProject,
	type LocalProjectsTableEntry,
} from "@/db/local-projects";
import { useNavigate } from "react-router";

export default function LocalProjectsManagerModal() {
	const { isOpen, onOpen, onOpenChange } = useDisclosure({
		id: "LOCAL_PROJECTS_MANAGER_MODAL",
	});
	const { t } = useLingui();
	const [projects, setProjects] = useState<LocalProjectsTableEntry[]>([]);

	useEffect(() => {
		getAllLocalProjects().then(setProjects);
	}, []);

	return (
		<>
			<Button
				onPress={onOpen}
				startContent={<Icon width={24} icon="mdi:calendar" />}
				color="secondary"
			>
				<Trans>manage projects</Trans>
			</Button>
			<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<Trans>projects</Trans>
							</ModalHeader>
							<ModalBody className="flex flex-col justify-center items-center gap-4">
								{projects.length === 0 ? (
									<>
										<Icon
											width={48}
											className="text-foreground-500 -mb-2"
											icon="mdi:emoticon-sad-outline"
										/>
										<p className="text-foreground-500 text-center">
											<Trans>
												you currently have no saved projects.
												<br />
												go create one!
											</Trans>
										</p>
									</>
								) : (
									projects.map((p) => (
										<LocalProjectCard
											key={p.id}
											project={p}
											onDelete={async () => {
												await removeLocalProject(p.id);
												setProjects(projects.filter((pr) => pr.id !== p.id));
											}}
										/>
									))
								)}
							</ModalBody>
							<ModalFooter />
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}

function LocalProjectCard(props: {
	project: LocalProjectsTableEntry;
	onDelete: () => void;
}) {
	const { t } = useLingui();
	const navigate = useNavigate();
	const [deleting, setDeleting] = useState(false);

	return (
		<Card className="w-full">
			<CardBody className="py-4 px-4 flex flex-col gap-2">
				<div className="flex flex-row gap-2 items-center">
					<Icon width={24} icon="mdi:swap-horizontal-bold" />
					<p className="text-ellipsis overflow-hidden text-nowrap">
						{props.project.name}
					</p>
				</div>
				<p className="text-tiny text-foreground-300 -mt-2">
					id: {props.project.id}
				</p>
				<div className="flex flex-row gap-2 mt-1">
					<Tooltip content={t`edit project`}>
						<Button
							color="primary"
							size="sm"
							isIconOnly
							startContent={<Icon width={18} icon="mdi:pencil" />}
							onPress={() => navigate(`/wizard?project=${props.project.id}`)}
						/>
					</Tooltip>
					<Tooltip content={t`delete project`}>
						<Button
							disabled={deleting}
							onPress={() => setDeleting(true)}
							color="danger"
							size="sm"
							isIconOnly
							startContent={<Icon width={18} icon="mdi:trash-can" />}
						/>
					</Tooltip>
					<Tooltip content={t`run project`}>
						<Button
							color="success"
							size="sm"
							isIconOnly
							startContent={
								<Icon
									className="text-white"
									width={24}
									icon="mdi:chevron-right"
								/>
							}
						/>
					</Tooltip>
				</div>
				{deleting && (
					<Alert
						color="danger"
						endContent={
							<div className="flex flex-row gap-2">
								<Button onPress={props.onDelete} color="danger">
									<Trans>yes</Trans>
								</Button>
								<Button
									onPress={() => setDeleting(false)}
									color="success"
									className="text-white"
								>
									<Trans>no</Trans>
								</Button>
							</div>
						}
						title={<Trans>are you sure?</Trans>}
					/>
				)}
			</CardBody>
		</Card>
	);
}
