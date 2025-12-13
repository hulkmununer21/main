import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, ImageIcon, FileText } from "lucide-react";

const dummyUploads = [
  { id: 1, type: "Photo", url: "https://via.placeholder.com/150", task: "Cleaning - 123 Main St", date: "2025-12-09" },
  { id: 2, type: "Report", url: "#", task: "Inspection - 789 High St", date: "2025-12-08" },
  { id: 3, type: "Note", url: "#", task: "Plumbing Repair - 456 River Rd", date: "2025-12-07" },
];

const ServiceUserUploads = () => (
  <div className="container mx-auto py-8 px-4 space-y-8">
    <h1 className="text-2xl font-bold mb-4">Task Uploads</h1>
    <div className="grid gap-6">
      {dummyUploads.map((upload) => (
        <Card key={upload.id}>
          <CardHeader>
            <CardTitle>{upload.type} for {upload.task}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-2">
              {upload.type === "Photo" ? <ImageIcon className="w-6 h-6 text-blue-600" /> : upload.type === "Report" ? <FileText className="w-6 h-6 text-green-600" /> : <Upload className="w-6 h-6 text-gray-600" />}
              <span className="text-muted-foreground text-sm">Uploaded: {upload.date}</span>
            </div>
            {upload.type === "Photo" ? (
              <img src={upload.url} alt="Upload" className="rounded-lg shadow-md w-32 h-32 object-cover" />
            ) : (
              <a href={upload.url} className="btn btn-outline">View {upload.type}</a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="mt-8">
      <button className="btn btn-primary">Upload New File</button>
    </div>
  </div>
);

export default ServiceUserUploads;
