import { Navigate, useLocation } from "react-router-dom";

const getToken = () => {
  try {
    return (
      window?.localStorage?.getItem("token") ||
      window?.localStorage?.getItem("pf_token") ||
      window?.localStorage?.getItem("projectforge_token") ||
      ""
    );
  } catch {
    return "";
  }
};

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
