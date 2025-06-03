import { Route, Routes } from "react-router";
import TransferWizardPage from "./features/transfer-wizard/TransferWizardPage";
import WelcomePage from "./pages/WelcomePage";
import { useHotkeys } from "react-hotkeys-hook";
import { useFormatEditorStore } from "./features/format-editor/store";

function App() {
	useHotkeys("shift+1", () => {
		const root = document.documentElement;
		if (root.classList.contains("green")) root.classList.remove("green");
		else root.classList.add("green");
	});
	useHotkeys("shift+2", () => {
		useFormatEditorStore
			.getState()
			.setRecording(!useFormatEditorStore.getState().recording);
	});
	useHotkeys("shift+3", () => {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		const el = document.getElementById("status")!;
		el.style.display = el.style.display === "none" ? "flex" : "none";
	});

	return (
		<Routes>
			<Route index element={<WelcomePage />} />
			<Route path="/wizard" element={<TransferWizardPage />} />
		</Routes>
	);
}

export default App;
