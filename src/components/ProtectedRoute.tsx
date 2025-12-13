import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<"lodger" | "landlord" | "staff" | "admin" | "service_user">;
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to their appropriate portal
      const routes: Record<string, string> = {
        lodger: "/lodger-portal",
        landlord: "/landlord-portal",
        staff: "/staff-portal",
        admin: "/admin-portal",
        service_user: "/serviceuser/dashboard",
      };
      navigate(routes[user.role], { replace: true });
    }
  }, [isAuthenticated, user, allowedRoles, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
