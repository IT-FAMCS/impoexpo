import { Provider } from "@/provider";
import { useSettingsStore } from "@/stores/settings";
import { i18n, type Messages } from "@lingui/core";
import { detect, fromStorage, fromUrl } from "@lingui/detect-locale";
import type { PropsWithChildren } from "react";
import React from "react";
import { scan } from "react-scan";

scan({
	enabled: true,
});

const locales = import.meta.glob("./locales/*.po");
for (const key in locales) {
	const name = key.replace("./locales/", "").replace(".po", "");
	i18n.load(name, ((await locales[key]()) as { messages: Messages }).messages);
}
i18n.activate(detect(fromStorage("locale"), fromUrl("locale")) ?? "en");
useSettingsStore.getState().load();

export default function Layout(props: { children?: React.ReactNode }) {
	return (
		<React.StrictMode>
			<Provider>{props.children}</Provider>
		</React.StrictMode>
	);
}
