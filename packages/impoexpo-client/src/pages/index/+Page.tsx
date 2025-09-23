import { Trans, useLingui } from "@lingui/react/macro";

import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { ReactNode, useRef, useState } from "react";
gsap.registerPlugin(SplitText, useGSAP);

type Slogan = {
	title: ReactNode;
	description: ReactNode;
	waitSeconds: number;
};

const slogans: Slogan[] = [
	{
		title: (
			<Trans>
				impoexpo is{" "}
				<span className="italic font-instrument">
					a data transfer automation tool
				</span>
			</Trans>
		),
		description: (
			<Trans>
				impoexpo allows one to easily transfer data between unrelated services,
				without the need to copy & paste a million times.
			</Trans>
		),
		waitSeconds: 1,
	},
	{
		title: <Trans>meow</Trans>,
		description: <Trans>meow</Trans>,
		waitSeconds: 1,
	},
];

export default function Index() {
	const { t } = useLingui();
	const titleRef = useRef<HTMLParagraphElement>(null!);
	const descriptionRef = useRef<HTMLParagraphElement>(null!);
	const [sloganIndex, setSloganIndex] = useState(0);

	useGSAP(() => {
		//titleRef.current.innerText = t(slogans[sloganIndex].title);
		//descriptionRef.current.innerText = t(slogans[sloganIndex].description);
		queueMicrotask(() => {
			SplitText.create(titleRef.current, {
				type: "words",
				mask: "words",
				onSplit: (titleSelf) => {
					return gsap.fromTo(
						titleSelf.words,
						{
							yPercent: 105,
						},
						{
							yPercent: 0,
							duration: 3 - 0.15 * (titleSelf.words.length - 1),
							stagger: 0.15,
							ease: "power4.inOut",
							onComplete: () => {
								gsap.to(titleSelf.words, {
									yPercent: -105,
									duration: 1,
									ease: "power4.inOut",
									delay: slogans[sloganIndex].waitSeconds + 2,
									onComplete: () =>
										setSloganIndex(
											sloganIndex >= slogans.length - 1 ? 0 : sloganIndex + 1,
										),
								});
							},
						},
					);
				},
			});
		});

		queueMicrotask(() => {
			SplitText.create(descriptionRef.current, {
				type: "lines",
				mask: "lines",
				onSplit: (descriptionSelf) => {
					return gsap.fromTo(
						descriptionSelf.lines,
						{
							yPercent: 105,
						},
						{
							yPercent: 0,
							duration: 2 - 0.15 * (descriptionSelf.lines.length - 1),
							delay: 3,
							stagger: 0.15,
							ease: "power4.inOut",
							onComplete: () => {
								gsap.to(descriptionSelf.lines, {
									yPercent: -105,
									duration: 1,
									ease: "power4.inOut",
									delay: slogans[sloganIndex].waitSeconds,
								});
							},
						},
					);
				},
			});
		});
	}, [sloganIndex]);

	return (
		<div className="flex items-center justify-center w-screen h-screen">
			<div className="flex flex-row items-center justify-center gap-4 w-[50%]">
				<div className="flex flex-col gap-4">
					<p className="text-6xl" ref={titleRef}>
						{slogans[sloganIndex].title}
					</p>
					<p className="text-2xl" ref={descriptionRef}>
						{slogans[sloganIndex].description}
					</p>
				</div>
			</div>
		</div>
	);
}

/* export default function Index() {
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
} */
