import BottomPanel from "@/components/buttons/BottomPanel";
import MobileWarningCard from "@/components/external/MobileWarningCard";
import { Provider } from "@/provider";
import React from "react";

export default function Layout(props: { children?: React.ReactNode }) {
	return (
		<React.StrictMode>
			<Provider>
				<div className="flex flex-col justify-between h-[100dvh] [&>*]:first:h-[calc(100dvh_-_8.5rem)] gap-4 p-5 box-border [&>*]:w-full">
					<MobileWarningCard>{props.children}</MobileWarningCard>
					<BottomPanel />
				</div>
			</Provider>
		</React.StrictMode>
	);
}
