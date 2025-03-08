import type { Integration } from "@/types/Integration";
import { GoogleFormsIntegration } from "./google-forms/GoogleFormsIntegration";

export const allIntegrations: Integration[] = [GoogleFormsIntegration];
export const readIntegrations: Integration[] = allIntegrations.filter(
	(i) => i.read,
);
export const writeIntegrations: Integration[] = allIntegrations.filter(
	(i) => i.write,
);
