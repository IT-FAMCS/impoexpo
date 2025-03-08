import { Route, Routes } from "react-router";
import WelcomePage from "./pages/WelcomePage";
import TransferWizardPage from "./pages/TransferWizardPage";

function App() {
	return (
		<Routes>
			<Route index element={<WelcomePage />} />
			<Route path="/wizard" element={<TransferWizardPage />} />
		</Routes>
	);
}

export default App;
