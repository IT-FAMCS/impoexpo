import { Route, Routes } from "react-router";
import TransferWizardPage from "./pages/TransferWizardPage";
import WelcomePage from "./pages/WelcomePage";
import PrivacyPage from "./pages/PrivacyPage";

function App() {
	return (
		<Routes>
			<Route index element={<WelcomePage />} />
			<Route path="/wizard" element={<TransferWizardPage />} />
			<Route path="/privacy" element={<PrivacyPage />} />
		</Routes>
	);
}

export default App;
