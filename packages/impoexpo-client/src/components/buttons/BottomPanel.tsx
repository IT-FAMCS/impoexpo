import {
	Button,
	Card,
	CardBody,
	Code,
	Link,
	Modal,
	ModalBody,
	ModalContent,
	Tooltip,
	useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";
import LocalProjectsManagerModal from "../modals/LocalProjectsManagerModal";
import SettingsModal from "../modals/SettingsModal";

export default function BottomPanel() {
	const ctx = usePageContext();
	const { isOpen, onOpen, onOpenChange } = useDisclosure({
		id: "BOTTOM_PANEL_MOBILE_MODAL",
	});

	return (
		<Card
			as="nav"
			className="flex items-center justify-center w-full h-20 shrink-0"
			shadow="sm"
		>
			<CardBody className="flex flex-row items-center justify-between h-full px-6 overflow-hidden">
				<div className="flex flex-row items-center gap-4">
					<Button
						onPress={() => navigate("/")}
						variant="light"
						isIconOnly
						startContent={<img alt="impoexpo's logo" src="/favicon.png" />}
					/>
					<Tooltip
						content={
							<Link
								isExternal
								showAnchorIcon
								href={import.meta.env.VITE_APP_LAST_COMMIT_LINK}
							>
								{import.meta.env.VITE_APP_LAST_COMMIT_MESSAGE}
							</Link>
						}
					>
						<Code className="flex-row items-center justify-center hidden gap-2 xl:flex">
							v{import.meta.env.VITE_APP_VERSION}{" "}
							<Icon icon="mdi:circle" width={4} />
							{import.meta.env.VITE_APP_HASH}
						</Code>
					</Tooltip>
				</div>
				<div className="flex-row items-center hidden gap-4 xl:flex">
					<Button
						variant={ctx.urlPathname === "/wizard" ? "flat" : "light"}
						color={ctx.urlPathname === "/wizard" ? "primary" : "default"}
						size="sm"
						className="flex-col gap-1 py-2 text-tiny h-fit"
						onPress={() => navigate("/wizard")}
						startContent={
							<Icon width={24} icon="material-symbols:compare-arrows-rounded" />
						}
					>
						<Trans>transfer</Trans>
					</Button>
					<LocalProjectsManagerModal
						trigger={(onOpen) => (
							<Button
								variant="light"
								size="sm"
								className="flex-col gap-1 py-2 text-tiny h-fit"
								onPress={onOpen}
								startContent={<Icon width={24} icon="mdi:calendar" />}
							>
								<Trans>projects</Trans>
							</Button>
						)}
					/>
				</div>
				<div className="flex-row items-center hidden gap-4 xl:flex">
					<SettingsModal
						trigger={(onOpen) => (
							<Button
								variant="light"
								color="default"
								size="sm"
								className="flex-col gap-1 py-2 text-tiny h-fit"
								startContent={<Icon width={24} icon="mdi:cog" />}
								onPress={onOpen}
							>
								<Trans>settings</Trans>
							</Button>
						)}
					/>
					<Button
						variant="light"
						color="default"
						size="sm"
						className="flex-col gap-1 py-2 text-tiny h-fit"
						startContent={<Icon width={24} icon="mdi:book-open-variant" />}
						as={Link}
						href={import.meta.env.VITE_DOCS_URL}
						isExternal
					>
						<Trans>documentation</Trans>
					</Button>
					<Button
						variant={ctx.urlPathname === "/privacy" ? "flat" : "light"}
						color={ctx.urlPathname === "/privacy" ? "secondary" : "default"}
						size="sm"
						className="flex-col gap-1 py-2 text-tiny h-fit"
						onPress={() => navigate("/privacy")}
						startContent={<Icon width={24} icon="mdi:shield-lock" />}
					>
						<Trans>legal</Trans>
					</Button>
				</div>

				<Button
					onPress={onOpen}
					color="primary"
					className="flex xl:hidden"
					isIconOnly
					startContent={<Icon width={24} icon="mdi:hamburger-menu" />}
				></Button>
				<Modal
					hideCloseButton
					isOpen={isOpen}
					backdrop="blur"
					onOpenChange={onOpenChange}
				>
					<ModalContent>
						{(onClose) => (
							<>
								<ModalBody className="flex flex-col gap-0 p-2">
									<Button
										variant="light"
										color="primary"
										size="lg"
										className="items-center justify-start h-16 gap-6 text-3xl"
										onPress={() => {
											onClose();
											navigate("/wizard");
										}}
										startContent={
											<Icon
												className="scale-150"
												width={24}
												icon="material-symbols:compare-arrows-rounded"
											/>
										}
									>
										<Trans>transfer</Trans>
									</Button>
									<LocalProjectsManagerModal
										trigger={(onOpen) => (
											<Button
												variant="light"
												color="secondary"
												size="lg"
												className="items-center justify-start h-16 gap-6 text-3xl"
												onPress={() => {
													onClose();
													onOpen();
												}}
												startContent={
													<Icon
														className="scale-150"
														width={24}
														icon="mdi:calendar"
													/>
												}
											>
												<Trans>projects</Trans>
											</Button>
										)}
									/>
									<SettingsModal
										trigger={(onOpen) => (
											<Button
												variant="light"
												size="lg"
												className="items-center justify-start h-16 gap-6 text-3xl"
												onPress={() => {
													onClose();
													onOpen();
												}}
												startContent={
													<Icon
														className="scale-150"
														width={24}
														icon="mdi:cog"
													/>
												}
											>
												<Trans>settings</Trans>
											</Button>
										)}
									/>
									<Button
										variant="light"
										size="lg"
										className="items-center justify-start h-16 gap-6 text-3xl"
										startContent={
											<Icon
												width={24}
												icon="mdi:book-open-variant"
												className="scale-150"
											/>
										}
										as={Link}
										href={import.meta.env.VITE_DOCS_URL}
										isExternal
									>
										<Trans>documentation</Trans>
									</Button>
									<Button
										variant="light"
										size="lg"
										className="items-center justify-start h-16 gap-6 text-3xl"
										onPress={() => {
											onClose();
											navigate("/privacy");
										}}
										startContent={
											<Icon
												className="scale-150"
												width={24}
												icon="mdi:shield-lock"
											/>
										}
									>
										<Trans>legal</Trans>
									</Button>
								</ModalBody>
							</>
						)}
					</ModalContent>
				</Modal>
			</CardBody>
		</Card>
	);
}
