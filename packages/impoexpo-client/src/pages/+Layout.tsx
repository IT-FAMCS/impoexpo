import BottomPanel from "@/components/buttons/BottomPanel";
import { Provider } from "@/provider";
import { Button, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import React, { useState } from "react";
import { scan } from "react-scan";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";

scan({
	enabled: true,
});

export default function Layout(props: { children?: React.ReactNode }) {
	const ctx = usePageContext();
	const pageSupportsMobile = (ctx.data as { supportsMobile: boolean })
		.supportsMobile;
	const [ignoreMobileWarning, setIgnoreMobileWarning] = useState(false);

	return (
		<React.StrictMode>
			<Provider>
				<div className="flex flex-col justify-between h-screen [&>*]:first:h-[calc(100vh_-_8.5rem)] gap-4 p-5 box-border [&>*]:w-full">
					{!pageSupportsMobile && !ignoreMobileWarning && (
						<Card>
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
						</Card>
					)}
					{(pageSupportsMobile || ignoreMobileWarning) && props.children}
					<BottomPanel />
				</div>
			</Provider>
		</React.StrictMode>
	);
}
