import {
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	Spinner,
	useDisclosure,
	useDraggable,
} from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useDocumentationModalStore } from "./store";
import { useAnimate } from "motion/react";

export default function DocumentationModal() {
	const [iframe, animate] = useAnimate<HTMLIFrameElement>();
	const [url, setUrl] = useState("");
	const target = useRef(null);
	const { isOpen, onOpen, onOpenChange } = useDisclosure({
		id: "DOCUMENTATION_MODAL",
	});
	const { setOpen } = useDocumentationModalStore();
	const { moveProps } = useDraggable({
		targetRef: target,
		isDisabled: !isOpen,
		canOverflow: true,
	});

	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		setOpen((u) => {
			setUrl(u);
			onOpen();
		});
	}, [onOpen, setOpen]);

	useEffect(() => {
		if (!isOpen && loaded) setLoaded(false);
	}, [isOpen, loaded]);

	useEffect(() => {
		if (loaded) animate(iframe.current, { opacity: [0, 1] });
	}, [loaded, animate, iframe]);

	return (
		<Modal
			ref={target}
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			className="min-w-[40vw] aspect-square"
		>
			<ModalContent>
				{() => (
					<>
						<ModalHeader {...moveProps} />
						<ModalBody className="w-full h-full px-0 pb-0">
							<iframe
								ref={iframe}
								onLoad={() => {
									if (!loaded) setLoaded(true);
								}}
								className="h-full opacity-0"
								title="impoexpo documentation"
								src={url}
							/>
							<div className="absolute top-0 flex flex-col justify-center items-center w-full h-full -z-10">
								<Spinner />
							</div>
						</ModalBody>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
