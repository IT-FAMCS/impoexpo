import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	useDisclosure,
	Alert,
} from "@heroui/react";

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
				данные не обновляются?
			</Button>
			<Modal size="lg" isOpen={isOpen} onOpenChange={onOpenChange}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>почему данные не обновляются?</ModalHeader>
							<ModalBody>
								<p>
									чтобы не нагружать сервер, мы кэшируем некоторые ресурсоёмкие
									запросы (например, всё что связано с интеграциями).
									<br />
									если вы <b>абсолютно уверены</b>, что вы обновили информацию,
									то нажмите на кнопку ниже.
								</p>
								<Alert color="danger">
									<p>
										учтите, что количество раз, сколько вы можете повторять этот
										запрос <b>ограничено</b>.<br />
										если вы будете делать это слишком часто, сервер даст вам
										таймаут.
									</p>
								</Alert>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									закрыть
								</Button>
								<Button
									color="primary"
									onPress={() => {
										onClose();
										props.onRefresh();
									}}
								>
									обновить
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
