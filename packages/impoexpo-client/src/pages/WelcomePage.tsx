import LanguageSwitcher from "@/components/buttons/LanguageSwitcher";
import ThemeSwitcher from "@/components/buttons/ThemeSwitcher";
import {
	Button,
	Card,
	CardBody,
	Code,
	Link,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { useNavigate } from "react-router";

export default function WelcomePage() {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const navigate = useNavigate();

	return (
		<div className="flex flex-col items-center justify-center w-screen h-screen gap-2 welcome-page-container">
			<Card>
				<CardBody>
					<h1 className="text-2xl">
						<Trans>
							welcome to <b>impoexpo</b>!
						</Trans>
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
					<Trans>new data transfer</Trans>
				</Button>
				<Button
					onPress={onOpen}
					startContent={<Icon fontSize={24} icon="material-symbols:info" />}
					variant="faded"
				>
					<Trans>about the project</Trans>
				</Button>
				<Modal isOpen={isOpen} size="lg" onOpenChange={onOpenChange}>
					<ModalContent>
						{(onClose) => (
							<>
								<ModalHeader>
									<Trans>about the project</Trans>
								</ModalHeader>
								<ModalBody>
									<p>
										<Trans>
											impoexpo's goal is to simplify the lives of people who
											regularly work with large amount of data, while also using
											several services at the same time.
										</Trans>
									</p>
									<p>
										<Trans>
											impoexpo is open-source and its code can be found{" "}
											<Link
												isExternal
												showAnchorIcon
												href="https://github.com/nedoxff/impoexpo"
											>
												here
											</Link>
											.
										</Trans>
									</p>
								</ModalBody>
								<ModalFooter>
									<Button color="primary" onPress={onClose}>
										ok
									</Button>
								</ModalFooter>
							</>
						)}
					</ModalContent>
				</Modal>
			</div>

			<div className="absolute flex flex-row items-center justify-center gap-2 bottom-3">
				<Code className="flex flex-row items-center justify-center gap-2">
					v{import.meta.env.VITE_APP_VERSION}{" "}
					<Icon icon="mdi:circle" width={4} />
					{import.meta.env.VITE_APP_HASH}
				</Code>
				<Icon icon="mdi:circle" width={6} />
				<ThemeSwitcher />
				<Icon icon="mdi:circle" width={6} />
				<LanguageSwitcher />
			</div>
		</div>
	);
}
