import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "@/styles/globals.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/common.ts";

// biome-ignore lint/style/noNonNullAssertion: boilerplate react code
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<BrowserRouter>
			<Provider>
				<QueryClientProvider client={queryClient}>
					<App />
				</QueryClientProvider>
			</Provider>
		</BrowserRouter>
	</React.StrictMode>,
);
