import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Shield, Lock } from "lucide-react";

const AdminLogin = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <>
      <SEO
        title="Administrator Login - Domus Servitia"
        description="Secure administrator login portal for Domus Servitia property management system."
      />
      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-900 via-red-800 to-orange-900 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200')] opacity-5 bg-cover bg-center"></div>
          <div className="relative z-10">
            <Link to="/" className="inline-block">
              <img src={logo} alt="Domus Servitia" className="h-24 rounded-xl shadow-2xl" />
            </Link>
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="font-serif text-5xl font-bold text-white leading-tight">
                  Admin Portal
                </h1>
                <p className="text-white/80 text-sm">System Administration</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-start gap-3 mb-4">
                <Lock className="h-5 w-5 text-white mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">Secure Access</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    This portal is restricted to authorized administrators only. All access attempts are logged and monitored for security purposes.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                <span>Full system access</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                <span>User & role management</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                <span>System configuration</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                <span>Analytics & reporting</span>
              </div>
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm text-white/60">
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

            <div className="text-center space-y-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-red-500/10 mb-2">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold">Administrator Access</h2>
              <p className="text-muted-foreground">
                Sign in with your administrator credentials
              </p>
            </div>

            <Card className="border-2 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  Secure Login
                </CardTitle>
                <CardDescription>
                  This portal requires administrator privileges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Administrator Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@domusservitia.com"
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

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-800 leading-relaxed">
                      <strong>Security Notice:</strong> Unauthorized access attempts will be logged and may result in legal action.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Sign In as Administrator
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="text-center space-y-2">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground block">
                ← Back to main login
              </Link>
              <p className="text-sm text-muted-foreground">
                Staff member?{" "}
                <Link to="/staff-login" className="text-accent hover:underline font-medium">
                  Staff Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
