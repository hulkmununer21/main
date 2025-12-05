import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("lodger");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password, userType);
  };

  const roleOptions = [
    {
      value: "lodger",
      label: "Lodger",
      icon: User,
      description: "Access your tenancy portal",
      color: "text-blue-600"
    },
    {
      value: "landlord",
      label: "Landlord",
      icon: Building2,
      description: "Manage your properties",
      color: "text-green-600"
    }
  ];

  return (
    <>
      <SEO
        title="Login - Domus Servitia | Access Your Property Portal"
        description="Sign in to your Domus Servitia portal. Access property management tools, payments, documents, and communications."
        keywords="domus servitia login, property portal login, landlord login, lodger portal"
        canonical="https://domusservitia.co.uk/login"
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
              Welcome to<br />Domus Servitia
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-md">
              Professional property management and lodging services at your fingertips.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md pt-6">
              {roleOptions.map((role) => (
                <div key={role.value} className="bg-background/10 backdrop-blur-sm rounded-lg p-4 border border-primary-foreground/20">
                  <role.icon className="h-8 w-8 text-primary-foreground mb-2" />
                  <p className="text-primary-foreground font-semibold">{role.label}</p>
                  <p className="text-primary-foreground/70 text-xs">{role.description}</p>
                </div>
              ))}
            </div>
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
            {/* Mobile Logo */}
            <div className="lg:hidden text-center">
              <Link to="/" className="inline-block mb-6">
                <img src={logo} alt="Domus Servitia" className="h-20 mx-auto rounded-xl shadow-md" />
              </Link>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Sign In</h2>
              <p className="text-muted-foreground">
                Access your portal to manage your property services
              </p>
            </div>

            <Card className="border-2">
              <CardHeader className="space-y-4">
                <div>
                  <CardTitle className="text-xl">Select Your Role</CardTitle>
                  <CardDescription>Choose your portal type</CardDescription>
                </div>
                
                <Tabs value={userType} onValueChange={setUserType} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    {roleOptions.map((role) => (
                      <TabsTrigger
                        key={role.value}
                        value={role.value}
                        className="flex flex-col gap-1 h-auto py-3"
                      >
                        <role.icon className={cn("h-5 w-5", role.color)} />
                        <span className="text-xs">{role.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        to="/forgot-password"
                        className="text-sm text-accent hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
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
                    Sign In
                  </Button>

                  <div className="text-center pt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link to="/signup" className="text-accent hover:underline font-medium">
                        Contact us to register
                      </Link>
                    </p>
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
                </form>
              </CardContent>
            </Card>

            <div className="text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
