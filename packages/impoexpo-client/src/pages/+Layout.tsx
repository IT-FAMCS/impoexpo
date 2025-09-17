import { Provider } from "@/provider";
import React from "react";
import { scan } from "react-scan";

scan({
	enabled: true,
});

export default function Layout(props: { children?: React.ReactNode }) {
	return (
		<React.StrictMode>
			<Provider>{props.children}</Provider>
		</React.StrictMode>
	);
}
