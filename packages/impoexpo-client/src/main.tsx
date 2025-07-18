import { scan } from "react-scan";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import "@/styles/globals.css";
import { type Messages, i18n } from "@lingui/core";
import { detect, fromStorage, fromUrl } from "@lingui/detect-locale";
import { I18nProvider } from "@lingui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/common.ts";

scan({
	enabled: true,
});

const locales = import.meta.glob("./locales/*.po");
for (const key in locales) {
	const name = key.replace("./locales/", "").replace(".po", "");
	i18n.load(name, ((await locales[key]()) as { messages: Messages }).messages);
}
i18n.activate(detect(fromStorage("locale"), fromUrl("locale")) ?? "en");

// biome-ignore lint/style/noNonNullAssertion: boilerplate react code
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<BrowserRouter>
			<Provider>
				<I18nProvider i18n={i18n}>
					<HeroUIProvider>
						<ToastProvider />
						<QueryClientProvider client={queryClient}>
							<App />
						</QueryClientProvider>
					</HeroUIProvider>
				</I18nProvider>
			</Provider>
		</BrowserRouter>
	</React.StrictMode>,
);
