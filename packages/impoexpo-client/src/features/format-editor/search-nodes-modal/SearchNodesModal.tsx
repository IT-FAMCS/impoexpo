import {
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/react";

export default function SearchNodesModal(props: {
	isOpen: boolean;
	onOpenChange: () => void;
	portal: React.MutableRefObject<HTMLDivElement>;
}) {
	return (
		<Modal
			backdrop="blur"
			classNames={{
				backdrop: "w-full h-full absolute",
				wrapper: "w-full h-full absolute",
			}}
			portalContainer={props.portal.current}
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
		>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader>meow?</ModalHeader>
						<ModalBody>meow!</ModalBody>
						<ModalFooter>uhm</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
