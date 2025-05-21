import { childLogger } from "../../../logger.js";

export const initializeDotnetRuntime = async () => {
	childLogger("integrations/microsoft/shared").info(
		"initializing the dotnet runtime (this may take a bit)",
	);

	// @ts-ignore
	const { dotnet } = await import("../_framework/dotnet.js");

	// @ts-ignore
	const { getAssemblyExports, getConfig } = await dotnet
		.withDiagnosticTracing(false)
		.create();
};
