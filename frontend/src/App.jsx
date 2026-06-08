import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import BrowseProjects from "./pages/BrowseProjects/BrowseProjects";
import ProjectDetail from "./pages/ProjectDetail/ProjectDetail";
import CreateProject from "./pages/CreateProject/CreateProject";
import EditProject from "./pages/EditProject/EditProject";
import MyProjects from "./pages/MyProjects/MyProjects";
import Login from "./pages/Auth/login";
import Register from "./pages/Auth/register";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Account from "./pages/Account/Account";
import MyApplications from "./pages/Applications/MyApplications";
import ProjectApplications from "./pages/Applications/ProjectApplications";
import Workspace from "./pages/Workspace/Workspace";
import LearningArchive from "./pages/LearningArchive/LearningArchive";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<BrowseProjects />} />
        <Route path="/projects" element={<BrowseProjects />} />
        <Route path="/learning-archive" element={<LearningArchive />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/projects/create"
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/edit"
          element={
            <ProtectedRoute>
              <EditProject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-projects"
          element={
            <ProtectedRoute>
              <MyProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications/sent"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id/applications"
          element={
            <ProtectedRoute>
              <ProjectApplications />
            </ProtectedRoute>
          }
        />

        {/* <Route
          path="/workspace/:projectId"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        /> */}
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
