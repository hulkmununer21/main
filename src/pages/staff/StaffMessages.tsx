import { MessageSquare, Send, User, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StaffMessages = () => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const adminMessages = [
    { id: 1, from: "Admin - James", subject: "Weekly Schedule Update", preview: "Please review the updated inspection schedule...", time: "2 hours ago", unread: true },
    { id: 2, from: "Admin - Sarah", subject: "New Property Assignment", preview: "You have been assigned to a new property at...", time: "Yesterday", unread: true },
    { id: 3, from: "Admin - James", subject: "Re: Maintenance Request", preview: "Thank you for the update. Please proceed with...", time: "2 days ago", unread: false },
  ];

  const serviceUserMessages = [
    { id: 1, from: "John D. (Service User)", subject: "Task Completed - Kitchen Clean", property: "123 Main St", preview: "I have completed the kitchen cleaning task...", time: "3 hours ago", unread: true },
    { id: 2, from: "Sarah M. (Service User)", subject: "Question about task", property: "456 River Rd", preview: "Hi, I wanted to ask about the bathroom...", time: "5 hours ago", unread: false },
    { id: 3, from: "Mike R. (Service User)", subject: "Garden Work Done", property: "789 High St", preview: "Finished all the garden maintenance as...", time: "Yesterday", unread: false },
  ];

  const conversationMessages = [
    { id: 1, sender: "Admin - James", content: "Hi, please review the updated inspection schedule for next week.", time: "2 hours ago", isMe: false },
    { id: 2, sender: "You", content: "Thanks James, I'll review it now. Any priority properties I should focus on?", time: "1 hour ago", isMe: true },
    { id: 3, sender: "Admin - James", content: "Yes, please prioritize 123 Main St and 456 River Rd - they have inspections due this week.", time: "45 mins ago", isMe: false },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="admin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Admin Messages
            <Badge variant="destructive" className="ml-1">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="service-users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Service User Messages
            <Badge variant="destructive" className="ml-1">1</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Message List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Admin Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {adminMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === `admin-${msg.id}` 
                          ? "bg-primary/10 border-primary" 
                          : msg.unread 
                            ? "bg-muted/50" 
                            : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedConversation(`admin-${msg.id}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{msg.from}</p>
                        {msg.unread && <Badge variant="destructive" className="text-xs">New</Badge>}
                      </div>
                      <p className="text-sm font-medium text-foreground">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{msg.preview}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {msg.time}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Conversation View */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedConversation ? "Conversation" : "Select a conversation"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedConversation ? (
                  <div className="space-y-4">
                    <div className="h-[300px] overflow-y-auto space-y-3 p-4 bg-muted/30 rounded-lg">
                      {conversationMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              msg.isMe
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border"
                            }`}
                          >
                            <p className="text-xs font-medium mb-1">{msg.sender}</p>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button className="self-end">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Select a conversation to view messages</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="service-users" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Message List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Service User Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceUserMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === `su-${msg.id}` 
                          ? "bg-primary/10 border-primary" 
                          : msg.unread 
                            ? "bg-muted/50" 
                            : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedConversation(`su-${msg.id}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{msg.from}</p>
                        {msg.unread && <Badge variant="destructive" className="text-xs">New</Badge>}
                      </div>
                      <p className="text-sm font-medium text-foreground">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground">{msg.property}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">{msg.preview}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {msg.time}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Conversation View */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedConversation?.startsWith('su-') ? "Conversation" : "Select a conversation"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedConversation?.startsWith('su-') ? (
                  <div className="space-y-4">
                    <div className="h-[300px] overflow-y-auto space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex justify-start">
                        <div className="max-w-[70%] p-3 rounded-lg bg-card border">
                          <p className="text-xs font-medium mb-1">John D. (Service User)</p>
                          <p className="text-sm">I have completed the kitchen cleaning task. All photos have been uploaded.</p>
                          <p className="text-xs opacity-70 mt-1">3 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message to this service user..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button className="self-end">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Select a conversation to view messages</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffMessages;
