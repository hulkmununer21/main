import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface User {
  email: string;
  role: "lodger" | "landlord" | "staff" | "admin";
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("domus-user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string, password: string, role: string) => {
    // Simulate login - in production, this would call an API
    const userData: User = {
      email,
      role: role as User["role"],
      name: email.split("@")[0],
    };

    setUser(userData);
    localStorage.setItem("domus-user", JSON.stringify(userData));

    // Check if this is a mobile context by checking the path
    const isMobileFlow = location.pathname.includes('/mobile') || 
                         location.pathname.includes('/onboarding') ||
                         location.pathname.includes('/app');

    // Redirect based on context and role
    if (isMobileFlow) {
      navigate("/mobile-home");
    } else {
      const routes = {
        lodger: "/lodger-portal",
        landlord: "/landlord-portal",
        staff: "/staff-portal",
        admin: "/admin-portal",
      };
      navigate(routes[role as keyof typeof routes]);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("domus-user");
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
