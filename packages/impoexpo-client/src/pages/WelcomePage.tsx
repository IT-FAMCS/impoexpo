import { Icon } from "@iconify/react";
import {
	Card,
	CardBody,
	Button,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
} from "@heroui/react";
import { useNavigate } from "react-router";

export default function WelcomePage() {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const navigate = useNavigate();

	return (
		<div className="flex flex-col justify-center items-center w-screen h-screen gap-2 welcome-page-container">
			<Card>
				<CardBody>
					<h1 className="text-2xl">
						добро пожаловать в <b>impoexpo</b>!
					</h1>
				</CardBody>
			</Card>
			<div className="flex flex-row gap-2">
				<Button
					onPress={() => navigate("/wizard")}
					startContent={
						<Icon
							fontSize={24}
							icon="material-symbols:compare-arrows-rounded"
						/>
					}
					color="primary"
				>
					начать новый перенос
				</Button>
				<Button
					onPress={onOpen}
					startContent={<Icon fontSize={24} icon="material-symbols:info" />}
					variant="faded"
				>
					о проекте
				</Button>
				<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
					<ModalContent>
						{(onClose) => (
							<>
								<ModalHeader>о проекте</ModalHeader>
								<ModalBody>траляля</ModalBody>
								<ModalFooter>
									<Button color="primary" onPress={onClose}>
										ОК
									</Button>
								</ModalFooter>
							</>
						)}
					</ModalContent>
				</Modal>
			</div>
		</div>
	);
}
