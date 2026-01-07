import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Wrench } from "lucide-react";

const ServiceUserLogin = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, 'service_user');
    } catch (error) {
      // Error is already handled by AuthContext with toast
      console.error('Service user login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Service User Login - Domus Servitia"
        description="Service user login portal for contractors, cleaners, and maintenance professionals."
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
              Service User Portal
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-md">
              Secure access for contractors and service professionals to manage tasks and upload reports.
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
              <h2 className="text-3xl font-bold">Service User Sign In</h2>
              <p className="text-muted-foreground">
                Access your assigned tasks and reports
              </p>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Service User Access</CardTitle>
                <CardDescription>Sign in with your service credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2 flex justify-center">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-xl bg-orange-500/10">
                      <Wrench className="h-10 w-10 text-orange-600" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="serviceuser@example.com"
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
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In as Service User"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="text-center space-y-2">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground block">
                ← Back to main login
              </Link>
              <p className="text-sm text-muted-foreground">
                Staff or Admin?{" "}
                <Link to="/staff-login" className="text-accent hover:underline font-medium">
                  Staff Login
                </Link>
                {" / "}
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

export default ServiceUserLogin;
