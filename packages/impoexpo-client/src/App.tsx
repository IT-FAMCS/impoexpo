import { Route, Routes } from "react-router";
import WelcomePage from "./pages/WelcomePage";
import NewTransferPage from "./pages/NewTransferPage";

function App() {
  return (
    <Routes>
      <Route index element={<WelcomePage/>}/>
      <Route path="/new" element={<NewTransferPage/>}/>
    </Routes>
  );
}

export default App;
