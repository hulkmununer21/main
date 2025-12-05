import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Users } from "lucide-react";

const StaffLogin = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password, "staff");
  };

  return (
    <>
      <SEO
        title="Staff Login - Domus Servitia"
        description="Staff and administrator login portal for Domus Servitia property management system."
      />
      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200')] opacity-10 bg-cover bg-center"></div>
          <div className="relative z-10">
            <Link to="/" className="inline-block">
              <img src={logo} alt="Domus Servitia" className="h-24 rounded-xl shadow-2xl" />
            </Link>
          </div>
          <div className="relative z-10 space-y-6">
            <h1 className="font-serif text-5xl font-bold text-primary-foreground leading-tight">
              Staff Portal
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-md">
              Secure access for staff members and administrators to manage property services and operations.
            </p>
          </div>
          <div className="relative z-10">
            <p className="text-sm text-primary-foreground/70">
              © 2024 Domus Servitia. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden text-center">
              <Link to="/" className="inline-block mb-6">
                <img src={logo} alt="Domus Servitia" className="h-20 mx-auto rounded-xl shadow-md" />
              </Link>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Staff Sign In</h2>
              <p className="text-muted-foreground">
                Access the staff management portal
              </p>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Staff Access</CardTitle>
                <CardDescription>Sign in with your staff credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2 flex justify-center">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-xl bg-purple-500/10">
                      <Users className="h-10 w-10 text-purple-600" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="staff@domusservitia.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold"
                    size="lg"
                  >
                    Sign In as Staff
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="text-center space-y-2">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground block">
                ← Back to main login
              </Link>
              <p className="text-sm text-muted-foreground">
                Administrator?{" "}
                <Link to="/admin-login" className="text-accent hover:underline font-medium">
                  Admin Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffLogin;
