import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/common";
import { useTheme } from "@heroui/use-theme";
import { navigate } from "vike/client/router";

import "./styles/globals.css";
import { clientOnly } from "vike-react/clientOnly";
import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { useEffect } from "react";
import { useSettingsStore } from "./stores/settings.ts";
import { detect, fromStorage, fromUrl } from "@lingui/detect-locale";
import { activateLocale } from "./locales/i18n.tsx";

export const Provider = clientOnly(
	async () => (await import("./provider.tsx")).InternalProvider,
);

export function InternalProvider({ children }: { children: React.ReactNode }) {
	useTheme();
	useEffect(() => {
		const locale = detect(fromStorage("locale"), fromUrl("locale")) ?? "en";
		activateLocale(locale);
		useSettingsStore.getState().load();
	}, []);

	return (
		<HeroUIProvider navigate={(href) => navigate(href)}>
			<I18nProvider i18n={i18n}>
				<ToastProvider />
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			</I18nProvider>
		</HeroUIProvider>
	);
}
