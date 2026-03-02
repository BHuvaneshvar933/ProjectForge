import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import BrowseProjects from "./pages/BrowseProjects/BrowseProjects";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/projects" element={<BrowseProjects />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;