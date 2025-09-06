import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	Spinner,
	useDisclosure,
	useDraggable,
} from "@heroui/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDocumentationModalStore } from "./store";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { AnimatePresence, motion, useAnimate } from "motion/react";

export default function DocumentationModal() {
	const [iframe, animate] = useAnimate<HTMLIFrameElement>();
	const target = useRef(null);
	const disclosure = useDisclosure({
		id: "DOCUMENTATION_MODAL",
	});
	const store = useDocumentationModalStore();
	const { moveProps } = useDraggable({
		targetRef: target,
		isDisabled: !disclosure.isOpen,
		canOverflow: true,
	});

	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		if (!store.disclosure && disclosure) store.setDisclosure(disclosure);
	}, [store, disclosure]);

	useEffect(() => {
		if (!disclosure.isOpen && loaded) setLoaded(false);
	}, [disclosure.isOpen, loaded]);

	useEffect(() => {
		if (loaded) animate(iframe.current, { opacity: [0, 1] });
	}, [loaded, animate, iframe]);

	return (
		<Modal
			ref={target}
			isOpen={disclosure.isOpen}
			onOpenChange={disclosure.onOpenChange}
			className="min-w-[40vw] aspect-square"
		>
			<ModalContent>
				{(onClose) => (
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
								src={store.url}
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
