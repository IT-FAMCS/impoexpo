import BottomPanel from "@/components/buttons/BottomPanel";
import { Provider } from "@/provider";
import React from "react";
import { scan } from "react-scan";

scan({
	enabled: true,
});

export default function Layout(props: { children?: React.ReactNode }) {
	return (
		<React.StrictMode>
			<Provider>
				<div className="flex flex-col justify-between h-screen gap-4 p-6 [&>*]:w-full">
					{props.children}
					<BottomPanel />
				</div>
			</Provider>
		</React.StrictMode>
	);
}
