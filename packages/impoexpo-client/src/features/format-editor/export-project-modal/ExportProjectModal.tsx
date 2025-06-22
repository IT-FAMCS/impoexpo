import { Trans, useLingui } from "@lingui/react/macro";
import {
	Alert,
	Button,
	Divider,
	Input,
	Listbox,
	ListboxItem,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/api/common";

export default function ExportProjectModal(props: {
	isOpen: boolean;
	onOpenChange: () => void;
	onClose: () => void;
}) {
	const { t } = useLingui();
	const { isFetching, refetch } = useQuery({
		queryKey: ["export-project"],
		queryFn: async () => {
			return await new Promise((resolve) => {
				setTimeout(() => {
					props.onClose();
					resolve(true);
				}, 3000);
			});
		},
		refetchOnWindowFocus: false,
		enabled: false,
	});

	return (
		<Modal
			backdrop="blur"
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
		>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className="pb-2">
							<Trans>project export</Trans>
						</ModalHeader>
						<ModalBody>
							<Trans>are you sure you want to export this project?</Trans>
							<Alert color="warning" className="whitespace-break-spaces">
								<p>
									<Trans>
										please note that&nbsp;
										<b>all integration-related notes will not be exported.</b>
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
							<Button
								onPress={() => refetch()}
								isLoading={isFetching}
								color="primary"
							>
								<Trans>export</Trans>
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
