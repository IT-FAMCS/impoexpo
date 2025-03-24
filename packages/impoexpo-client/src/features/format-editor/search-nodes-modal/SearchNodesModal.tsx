import { Modal, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";

export default function SearchNodesModal(props: {
	isOpen: boolean;
	onOpenChange: () => void;
	portal: React.MutableRefObject<HTMLDivElement>;
}) {
	return (
		<Modal
			portalContainer={props.portal.current}
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
		>
			<ModalHeader>uhm</ModalHeader>
			<ModalContent>meow</ModalContent>
			<ModalFooter>kldf</ModalFooter>
		</Modal>
	);
}
