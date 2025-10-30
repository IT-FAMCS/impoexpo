import BottomPanel from "@/components/buttons/BottomPanel";
import MobileWarningCard from "@/components/external/MobileWarningCard";
import { Provider } from "@/provider";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import React from "react";
import { addToast, Button, Link } from "@heroui/react";
import { Trans } from "@lingui/react/macro";
import { Icon } from "@iconify/react";
import { navigate } from "vike/client/router";

function CustomErrorBoundary({ error }: FallbackProps) {
	return (
		<div className="flex flex-col justify-center items-center w-[100dvw] h-[100dvh] gap-2">
			<Icon width={96} icon="mdi:emoticon-sad-outline" />
			<p className="text-center">
				<span className="text-3xl">
					<Trans>
						something went <b>terribly</b> wrong...
					</Trans>
				</span>
				<br />
				<Trans>
					if you can, please{" "}
					<Link
						isExternal
						showAnchorIcon
						href="https://github.com/IT-FAMCS/impoexpo"
					>
						contact the developers!
					</Link>
				</Trans>
			</p>
			<div className="flex flex-row gap-2">
				<Button
					color="success"
					onPress={async () => {
						try {
							const message =
								error instanceof Error ? error.message : `${error}`;
							const stack = error instanceof Error ? error.stack : undefined;
							await navigator.clipboard.writeText(`${message}\n\n${stack}`);
							addToast({
								color: "success",
								title: <Trans>ok</Trans>,
							});
						} catch (err) {
							addToast({
								color: "danger",
								title: <Trans>failed to copy error message to clipboard</Trans>,
								description: <p className="font-mono">{`${err}`}</p>,
							});
						}
					}}
				>
					<Icon width={24} icon="mdi:content-copy" />
					<Trans>copy error message</Trans>
				</Button>
				<Button
					color="primary"
					onPress={async () => {
						await navigate("/");
						window.location.reload();
					}}
				>
					<Icon width={24} icon="mdi:home" />
					<Trans>return to the homepage</Trans>
				</Button>
			</div>
		</div>
	);
}

export default function Layout(props: { children?: React.ReactNode }) {
	return (
		<React.StrictMode>
			<Provider>
				<ErrorBoundary FallbackComponent={CustomErrorBoundary}>
					<div className="flex flex-col justify-between h-[100dvh] [&>*]:first:h-[calc(100dvh_-_8.5rem)] gap-4 p-5 box-border [&>*]:w-full">
						<MobileWarningCard>{props.children}</MobileWarningCard>
						<BottomPanel />
					</div>
				</ErrorBoundary>
			</Provider>
		</React.StrictMode>
	);
}
