import {
	Alert,
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	useDisclosure,
} from "@heroui/react";
import { Trans } from "@lingui/react/macro";

export default function CacheInfoModal(props: {
	onRefresh: () => void;
	className?: string;
}) {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();

	return (
		<>
			<Button
				className={props.className}
				variant="flat"
				size="sm"
				onPress={onOpen}
			>
				<Trans>the data is stale?</Trans>
			</Button>
			<Modal size="lg" isOpen={isOpen} onOpenChange={onOpenChange}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>
								<Trans>why doesn't the data refresh?</Trans>
							</ModalHeader>
							<ModalBody>
								<p>
									<Trans>
										in order to avoid overwhelming the server, we cache some
										resource-intensive requests (i.e. anything related to
										integrations).
										<br />
										if you're <b>absolutely sure</b> that you've updated the
										data, click the button bellow.
									</Trans>
								</p>
								<Alert color="danger">
									<p>
										<Trans>
											please note that the amount of times you can perform this
											request is <b>limited</b>.<br />
											if you'll do it too often, the server will give you a
											timeout.
										</Trans>
									</p>
								</Alert>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									<Trans>close</Trans>
								</Button>
								<Button
									color="primary"
									onPress={() => {
										onClose();
										props.onRefresh();
									}}
								>
									<Trans>refresh</Trans>
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
