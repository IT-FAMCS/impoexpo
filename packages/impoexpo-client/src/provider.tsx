import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/common";
import { useTheme } from "@heroui/use-theme";
import { navigate } from "vike/client/router";

import "./styles/globals.css";
import { clientOnly } from "vike-react/clientOnly";
import { I18nProvider } from "@lingui/react";
import { i18n, type Messages } from "@lingui/core";
import { useEffect } from "react";
import { useSettingsStore } from "./stores/settings.ts";
import { detect, fromStorage, fromUrl } from "@lingui/detect-locale";
import { getUserLocale } from "get-user-locale";
import { useHotkeys } from "react-hotkeys-hook";

export const Provider = clientOnly(
	async () =>
		({ children }: { children: React.ReactNode }) => {
			useHotkeys("shift+1", () => {
				const root = document.documentElement;
				if (root.classList.contains("green")) root.classList.remove("green");
				else root.classList.add("green");
			});

			useTheme();

			useEffect(() => {
				(async () => {
					const locale =
						detect(fromStorage("locale"), fromUrl("locale")) ?? "en";
					const locales = import.meta.glob("./locales/*.po");
					for (const key in locales) {
						const name = key.replace("./locales/", "").replace(".po", "");
						i18n.load(
							name,
							((await locales[key]()) as { messages: Messages }).messages,
						);
					}
					i18n.activate(locale);
					useSettingsStore.getState().load();
				})();

				document
					.getElementById("react-scan-root")
					?.classList.add("green:hidden");
			}, []);

			return (
				<HeroUIProvider
					locale={getUserLocale()}
					navigate={(href) => navigate(href)}
				>
					<I18nProvider i18n={i18n}>
						<ToastProvider />
						<QueryClientProvider client={queryClient}>
							{children}
						</QueryClientProvider>
					</I18nProvider>
				</HeroUIProvider>
			);
		},
);
