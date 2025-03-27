import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import { HeroUIProvider } from "@heroui/react";
import "@/styles/globals.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/common.ts";
import { i18n, type Messages } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import {
	detect,
	fromNavigator,
	fromStorage,
	fromUrl,
} from "@lingui/detect-locale";

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
				<HeroUIProvider>
					<QueryClientProvider client={queryClient}>
						<I18nProvider i18n={i18n}>
							<main className="text-foreground bg-background/*  */">
								<App />
							</main>
						</I18nProvider>
					</QueryClientProvider>
				</HeroUIProvider>
			</Provider>
		</BrowserRouter>
	</React.StrictMode>,
);
