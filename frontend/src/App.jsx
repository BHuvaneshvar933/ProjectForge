import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import BrowseProjects from "./pages/BrowseProjects/BrowseProjects";
import ProjectDetail from "./pages/ProjectDetail/ProjectDetail";
import CreateProject from "./pages/CreateProject/CreateProject";
import EditProject from "./pages/EditProject/EditProject";
import MyProjects from "./pages/MyProjects/MyProjects";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<BrowseProjects />} />
        <Route path="/projects" element={<BrowseProjects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/create" element={<CreateProject />} />
        <Route path="/projects/:id/edit" element={<EditProject />} />
        <Route path="/my-projects" element={<MyProjects />} />
      </Routes>
      <ToastContainer 
        position="bottom-right" 
        theme="dark" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </BrowserRouter>
  );
}

export default App;