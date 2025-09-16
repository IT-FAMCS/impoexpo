import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { queryClient } from "./api/common";
import { useTheme } from "@heroui/use-theme";
import { navigate } from "vike/client/router";

import "./styles/globals.css";

export function Provider({ children }: { children: React.ReactNode }) {
	useTheme();

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
