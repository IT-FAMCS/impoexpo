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
	Link,
	Code,
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
				<Modal isOpen={isOpen} size="lg" onOpenChange={onOpenChange}>
					<ModalContent>
						{(onClose) => (
							<>
								<ModalHeader>о проекте</ModalHeader>
								<ModalBody>
									<p>
										impoexpo стремится упростить жизнь пользователей, которые
										часто взаимодействуют с большим объёмом данных, используя
										при этом различные сервисы.
									</p>
									<p>
										исходный код impoexpo открыт и может быть найден{" "}
										<Link
											isExternal
											showAnchorIcon
											href="https://github.com/nedoxff/impoexpo"
										>
											здесь
										</Link>
										. основной разработчик &mdash;{" "}
										<Link
											isExternal
											showAnchorIcon
											className="inline-flex gap-1 w-min"
											href="https://github.com/nedoxff"
										>
											<Code>@nedoxff</Code>
										</Link>
										.
									</p>
								</ModalBody>
								<ModalFooter>
									<Button color="primary" onPress={onClose}>
										OK
									</Button>
								</ModalFooter>
							</>
						)}
					</ModalContent>
				</Modal>
			</div>

			<div className="absolute flex flex-row gap-2 bottom-3">
				<Code className="flex flex-row justify-center items-center gap-2">
					v{import.meta.env.VITE_APP_VERSION}{" "}
					<Icon icon="mdi:circle" width={4} />
					{import.meta.env.VITE_APP_HASH}
				</Code>
			</div>
		</div>
	);
}
