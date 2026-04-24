import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingBlock } from "./Feedback";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingBlock label="Checking your session..." />;
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default ProtectedRoute;
