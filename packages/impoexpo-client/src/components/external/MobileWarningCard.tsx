import useLinguiChange from "@/hooks/useLinguiChange";
import { Card, CardBody, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";

const detectMobile = () => {
	if (/Mobi/i.test(window.navigator.userAgent)) {
		console.log('isMobile: found "Mobi" in the user agent');
		return true;
	}
	if (
		"userAgentData" in window.navigator &&
		(window.navigator.userAgentData as { mobile: boolean }).mobile
	) {
		console.log("isMobile: window.navigator.userAgentData.mobile === true");
		return true;
	}

	if (!window.matchMedia("(hover: hover)").matches) {
		console.log("isMobile: hover not available");
		return true;
	}

	console.log("isMobile: false");
	return false;
};

const AnimatedCard = motion.create(Card);
export default function MobileWarningCard(props: { children?: ReactNode }) {
	const ctx = usePageContext();
	const pageSupportsMobile = (ctx.data as { supportsMobile: boolean })
		.supportsMobile;
	const [ignoreMobileWarning, setIgnoreMobileWarning] = useState(false);
	const [isMobile, setIsMobile] = useState(detectMobile());

	useEffect(() => {
		window.addEventListener("resize", () => setIsMobile(detectMobile()));
	}, []);

	useLinguiChange((i18n) => {
		document.documentElement.lang = i18n.locale;
	});

	return (
		<>
			{isMobile && !pageSupportsMobile && !ignoreMobileWarning && (
				<AnimatedCard
					initial={{
						opacity: 0,
						y: 10,
					}}
					animate={{
						opacity: 1,
						y: 0,
					}}
					transition={{
						duration: 0.25,
						ease: [0.83, 0, 0.17, 1],
					}}
				>
					<CardBody className="flex flex-col items-center justify-center w-full h-full gap-2">
						<Icon width={72} icon="mdi:emoticon-sad-outline" />
						<p className="text-xl font-medium text-center">
							<Trans>
								it seems like you're viewing impoexpo on a mobile device.
							</Trans>
						</p>
						<p className="text-lg text-center text-foreground-500">
							<Trans>
								this page is currently not optimized for mobile devices
								(including tablets).
								<br />
								we recommend using impoexpo with a 16:9 monitor.
							</Trans>
						</p>
						<p className="text-xl text-center">
							<Trans>do you wish to continue?</Trans>
						</p>
						<div className="flex flex-row gap-2">
							<Button
								onPress={() => setIgnoreMobileWarning(true)}
								color="danger"
							>
								<Trans>yes</Trans>
							</Button>
							<Button onPress={() => navigate("/")} color="success">
								<Trans>no</Trans>
							</Button>
						</div>
					</CardBody>
				</AnimatedCard>
			)}
			{(!isMobile || pageSupportsMobile || ignoreMobileWarning) &&
				props.children}
		</>
	);
}
