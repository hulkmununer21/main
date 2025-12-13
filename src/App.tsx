import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Login from "./pages/Login";
import StaffLogin from "./pages/StaffLogin";
import AdminLogin from "./pages/AdminLogin";
import ServiceUserLogin from "./pages/ServiceUserLogin";
import Signup from "./pages/Signup";
import AppSplash from "./pages/AppSplash";
import Onboarding from "./pages/Onboarding";
import MobileHome from "./pages/MobileHome";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import About from "./pages/About";
import ServicesPage from "./pages/ServicesPage";
import LodgerPortal from "./pages/LodgerPortal";
import LodgerOverview from "./pages/lodger/LodgerOverview";
import LodgerPayments from "./pages/lodger/LodgerPayments";
import LodgerMaintenance from "./pages/lodger/LodgerMaintenance";
import LodgerMessages from "./pages/lodger/LodgerMessages";
import LodgerProfile from "./pages/lodger/LodgerProfile";
import LandlordPortal from "./pages/LandlordPortal";
import LandlordOverview from "./pages/landlord/LandlordOverview";
import LandlordProperties from "./pages/landlord/LandlordProperties";
import LandlordTenants from "./pages/landlord/LandlordTenants";
import LandlordFinancials from "./pages/landlord/LandlordFinancials";
import LandlordProfile from "./pages/landlord/LandlordProfile";
import StaffOverview from "./pages/staff/StaffOverview";
import StaffPortal from "./pages/StaffPortal";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminPortal from "./pages/AdminPortal";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import GDPR from "./pages/GDPR";
import FAQ from "./pages/FAQ";
import SubmitComplaint from "./pages/SubmitComplaint";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";
import ServiceUserDashboard from "./pages/serviceuser/ServiceUserDashboard";
import ServiceUserTasks from "./pages/serviceuser/ServiceUserTasks";
import ServiceUserUploads from "./pages/serviceuser/ServiceUserUploads";
import ServiceUserProfile from "./pages/serviceuser/ServiceUserProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/serviceuser-login" element={<ServiceUserLogin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/app" element={<AppSplash />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/mobile-home" element={<MobileHome />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/gdpr" element={<GDPR />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/submit-complaint" element={<SubmitComplaint />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route
              path="/lodger-portal"
              element={
                <ProtectedRoute allowedRoles={["lodger"]}>
                  <LodgerPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lodger-portal/payments"
              element={
                <ProtectedRoute allowedRoles={["lodger"]}>
                  <LodgerPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lodger-portal/maintenance"
              element={
                <ProtectedRoute allowedRoles={["lodger"]}>
                  <LodgerMaintenance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lodger-portal/messages"
              element={
                <ProtectedRoute allowedRoles={["lodger"]}>
                  <LodgerMessages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lodger-portal/profile"
              element={
                <ProtectedRoute allowedRoles={["lodger"]}>
                  <LodgerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord-portal"
              element={
                <ProtectedRoute allowedRoles={["landlord"]}>
                  <LandlordPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord-portal/properties"
              element={
                <ProtectedRoute allowedRoles={["landlord"]}>
                  <LandlordProperties />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord-portal/tenants"
              element={
                <ProtectedRoute allowedRoles={["landlord"]}>
                  <LandlordTenants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord-portal/financials"
              element={
                <ProtectedRoute allowedRoles={["landlord"]}>
                  <LandlordFinancials />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord-portal/profile"
              element={
                <ProtectedRoute allowedRoles={["landlord"]}>
                  <LandlordProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-portal"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-portal/tasks"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-portal/inspections"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-portal/messages"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-portal/profile"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-portal"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-portal/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-portal/properties"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-portal/reports"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-portal/settings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPortal />
                </ProtectedRoute>
              }
            />
            {/* Service User Protected Routes */}
            <Route
              path="/serviceuser/dashboard"
              element={
                <ProtectedRoute allowedRoles={["service_user"]}>
                  <ServiceUserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/serviceuser/tasks"
              element={
                <ProtectedRoute allowedRoles={["service_user"]}>
                  <ServiceUserTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/serviceuser/uploads"
              element={
                <ProtectedRoute allowedRoles={["service_user"]}>
                  <ServiceUserUploads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/serviceuser/profile"
              element={
                <ProtectedRoute allowedRoles={["service_user"]}>
                  <ServiceUserProfile />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
