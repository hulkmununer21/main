import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { 
  AuthContext, 
  User, 
  LandlordProfile, 
  LodgerProfile 
} from "@/contexts/AuthContextTypes";

// Helper function to fetch user profile based on role
const profileTables: Record<User["role"], string> = {
  landlord: "landlord_profiles",
  lodger: "lodger_profiles",
  staff: "staff_profiles",
  admin: "admin_profiles",
  service_user: "service_user_profiles",
};

const fetchUserProfile = async (userId: string, role: User["role"]) => {
  let profile = null;

  const tableName = profileTables[role];
  if (tableName) {
    const result = await supabase.from(tableName).select("*").eq("user_id", userId).single();
    profile = result.data;
  }

  return profile;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage on initial load
    const storedUser = localStorage.getItem("domus-user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const navigate = useNavigate();

  // Listen to Supabase auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setUser(null);
        localStorage.removeItem("domus-user");
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, expectedRole?: User["role"]) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      toast.error("Invalid email or password.");
      throw new Error(error?.message || "Login failed");
    }

    const userId = data.user.id;

    // Get role from user_roles table
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    const role = roleData?.role;
    if (!role) {
      toast.error("No role assigned to this user.");
      throw new Error("No role assigned to this user.");
    }

    // Validate role if expectedRole is provided
    if (expectedRole && role !== expectedRole) {
      await supabase.auth.signOut();
      const roleNames: Record<User["role"], string> = {
        admin: "Administrators",
        staff: "Staff Members",
        landlord: "Landlords",
        lodger: "Lodgers",
        service_user: "Service Users"
      };
      toast.error(`Access Denied: This portal is for ${roleNames[expectedRole]} only. Please use the correct login page.`);
      throw new Error(`Access denied: Expected ${expectedRole} role, but user has ${role} role.`);
    }

    // Fetch profile
    const profile = await fetchUserProfile(userId, role);

    if (!profile) {
      toast.error("User profile not found. Please contact support.");
      throw new Error("User profile not found.");
    }

    // Update last_login timestamp
    const profileTable = profileTables[role];
    if (profileTable) {
      await supabase
        .from(profileTable)
        .update({ last_login: new Date().toISOString() })
        .eq("user_id", userId);
    }

    const userData: User = {
      id: userId,
      email,
      role,
      name: profile.full_name || email.split("@")[0],
      profile: profile,
    };

    setUser(userData);
    localStorage.setItem("domus-user", JSON.stringify(userData));

    // Redirect based on role
    const routes: Record<User["role"], string> = {
      lodger: "/lodger-portal",
      landlord: "/landlord-portal",
      staff: "/staff-portal",
      admin: "/admin-portal",
      service_user: "/serviceuser/dashboard",
    };
    navigate(routes[role]);
  };

  const signup = async (
    email: string,
    password: string,
    role: "lodger" | "landlord",
    profileData: { full_name: string; phone?: string; [key: string]: unknown }
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      toast.error(error?.message || "Signup failed");
      throw new Error(error?.message || "Signup failed");
    }
    const userId = data.user.id;

    // Insert into profile table with full_name as required field
    const profileTable = role === "landlord" ? "landlord_profiles" : "lodger_profiles";
    const { error: profileError } = await supabase
      .from(profileTable)
      .insert([{ 
        user_id: userId, 
        email, 
        full_name: profileData.full_name,
        ...profileData 
      }]);

    if (profileError) {
      toast.error("Failed to create profile: " + profileError.message);
      throw new Error(profileError.message);
    }

    // Insert into user_roles
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert([{ user_id: userId, role, is_active: true }]);

    if (roleError) {
      toast.error("Failed to assign role: " + roleError.message);
      throw new Error(roleError.message);
    }

    toast.success("Account created successfully! Please log in.");
    
    // Auto-login after signup
    await login(email, password);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("domus-user");
    supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
