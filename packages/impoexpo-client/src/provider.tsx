import type { NavigateOptions } from "react-router";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { useHref, useNavigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { queryClient } from "./api/common";
import { useTheme } from "@heroui/use-theme";

declare module "@react-types/shared" {
	interface RouterConfig {
		routerOptions: NavigateOptions;
	}
}

export function Provider({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate();
	useTheme();

	return (
		<HeroUIProvider navigate={navigate} useHref={useHref}>
			<I18nProvider i18n={i18n}>
				<ToastProvider />
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			</I18nProvider>
		</HeroUIProvider>
	);
}
