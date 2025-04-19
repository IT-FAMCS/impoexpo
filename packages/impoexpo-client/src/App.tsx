import { Route, Routes } from "react-router";
import TransferWizardPage from "./features/transfer-wizard/TransferWizardPage";
import WelcomePage from "./pages/WelcomePage";

function App() {
	return (
		<Routes>
			<Route index element={<WelcomePage />} />
			<Route path="/wizard" element={<TransferWizardPage />} />
		</Routes>
	);
}

export default App;
