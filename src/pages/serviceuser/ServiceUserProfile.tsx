import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone } from "lucide-react";

const dummyProfile = {
  name: "James Wilson",
  type: "Cleaner",
  email: "james@cleaning.co.uk",
  phone: "07123 456789",
  status: "Active",
  activeTasks: 3,
  completedTasks: 45,
};

const ServiceUserProfile = () => (
  <div className="container mx-auto py-8 px-4 space-y-8">
    <h1 className="text-2xl font-bold mb-4">Profile</h1>
    <Card>
      <CardHeader>
        <CardTitle>{dummyProfile.name} ({dummyProfile.type})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-2">
          <User className="w-8 h-8 text-primary" />
          <span className="text-muted-foreground text-sm">Status: {dummyProfile.status}</span>
        </div>
        <div className="mb-2 flex gap-4">
          <Mail className="w-5 h-5 text-blue-600" />
          <span>{dummyProfile.email}</span>
        </div>
        <div className="mb-2 flex gap-4">
          <Phone className="w-5 h-5 text-green-600" />
          <span>{dummyProfile.phone}</span>
        </div>
        <div className="mt-4">
          <p className="font-semibold">Active Tasks: {dummyProfile.activeTasks}</p>
          <p className="font-semibold">Completed Tasks: {dummyProfile.completedTasks}</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default ServiceUserProfile;
