import { registerIntegration } from "../../registry";
import { access, constants } from "node:fs/promises";
import { initializeDotnetRuntime } from "./common/runtime";

registerIntegration({
	id: "microsoft-shared",
	async init() {
		try {
			await access("src/integrations/microsoft/_framework/", constants.R_OK);
		} catch {
			return {
				success: false,
				message:
					"the _framework folder containing SimpleOfficePatchers' WASM build was not found",
				help: "documentation about SimpleOfficePatchers can be found here: https://github.com/IT-FAMCS/SimpleOfficePatchers",
			};
		}

		try {
			await initializeDotnetRuntime();
		} catch (err) {
			return {
				success: false,
				message: `failed to initialize the dotnet runtime: ${err}`,
			};
		}

		return { success: true };
	},
});
