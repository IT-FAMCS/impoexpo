import { createProjectSnapshot } from "@/db/snapshot";
import {
	Alert,
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";

export default function ExportProjectModal(props: {
	isOpen: boolean;
	onOpenChange: () => void;
	onClose: () => void;
}) {
	const exportProject = async () => {
		const template = await createProjectSnapshot("template");

		const a = document.createElement("a");
		a.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(template))}`;
		a.download = "project.json";
		a.style.display = "none";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		props.onClose();
	};

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
							<Icon width={24} icon="mdi:download" />
							<Trans>export project</Trans>
						</ModalHeader>
						<ModalBody>
							<Trans>are you sure you want to export this project?</Trans>
							<Alert color="warning" className="whitespace-break-spaces">
								<p>
									<Trans>
										please note that&nbsp;
										<b>
											all integration-related information will not be exported.
										</b>
										&nbsp;this means that, when importing the project, you'll
										have to reattach all integration nodes again.
									</Trans>
								</p>
							</Alert>
						</ModalBody>
						<ModalFooter className="pt-2">
							<Button color="danger" variant="light" onPress={onClose}>
								<Trans>cancel</Trans>
							</Button>
							<Button onPress={exportProject} color="primary">
								<Trans>export</Trans>
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
