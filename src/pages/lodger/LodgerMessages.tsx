import { useState } from "react";
import { Bell, User, LogOut, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/mobile/BottomNav";

const LodgerMessages = () => {
  const { logout, user } = useAuth();

  const messages = [
    { id: 1, from: "Property Manager", subject: "Maintenance Update", preview: "Your recent maintenance request has been...", date: "2 hours ago", unread: true },
    { id: 2, from: "Accounts Team", subject: "Payment Confirmation", preview: "Thank you for your payment of £750...", date: "1 day ago", unread: false },
    { id: 3, from: "Admin", subject: "Important Notice", preview: "Please be advised that scheduled maintenance...", date: "3 days ago", unread: false },
  ];

  return (
    <>
      <SEO 
        title="Messages - Lodger Portal - Domus Dwell Manage"
        description="View and send messages to property management"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Messages</h1>
                <p className="text-sm text-muted-foreground">Communicate with property management</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Message List */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Message Center</CardTitle>
              <CardDescription>Communicate with property management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 border rounded-lg hover:shadow-elegant transition-all cursor-pointer ${
                      message.unread ? "border-accent bg-accent/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{message.from}</p>
                        {message.unread && (
                          <Badge className="bg-accent">New</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{message.date}</p>
                    </div>
                    <p className="font-medium text-sm mb-1">{message.subject}</p>
                    <p className="text-sm text-muted-foreground">{message.preview}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4">
                <Send className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </CardContent>
          </Card>

          {/* Bottom padding for mobile nav */}
          <div className="h-20 md:h-0"></div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav role="lodger" />
    </>
  );
};

export default LodgerMessages;
