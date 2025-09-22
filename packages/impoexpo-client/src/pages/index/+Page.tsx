import SwitchesPanel from "@/components/buttons/SwitchesPanel";
import LocalProjectsManagerModal from "@/components/modals/LocalProjectsManagerModal";
import {
	Button,
	Card,
	CardBody,
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
import { navigate } from "vike/client/router";

import motion from "motion";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
gsap.registerPlugin(SplitText, useGSAP);

/* export default function Index() {
	const titleRef = useRef<HTMLParagraphElement>(null!);
	const descriptionRef = useRef<HTMLParagraphElement>(null!);

	return (
		<div className="w-screen h-screen flex justify-center items-center">
			<div className="flex-row gap-2"></div>
		</div>
	);
}
 */
export default function Index() {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();

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
			<div className="flex flex-col gap-2">
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
					<LocalProjectsManagerModal />
				</div>
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
			<div className="absolute bottom-3">
				<SwitchesPanel showPrivacyPolicy />
			</div>
		</div>
	);
}
