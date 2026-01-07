import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Calendar, Upload, 
  Camera, X, CheckCircle, Loader2, PlayCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  task_status: string;
  due_date: string;
  service_user_id: string;
  // ✅ FIXED: address_line1
  properties?: { property_name: string; address_line1: string; postcode: string };
  rooms?: { room_number: string };
}

const ServiceUserTasks = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadNote, setUploadNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTask = async () => {
    try {
      if (!taskId) return;
      setLoading(true);

      // ✅ FIXED: address_line1
      const { data, error } = await supabase
        .from('service_user_tasks')
        .select(`*, properties(property_name, address_line1, postcode), rooms(room_number)`)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      setTask(data);

      const { data: uploads } = await supabase
        .from('service_user_uploads')
        .select('*')
        .eq('task_id', taskId);
        
      setUploadedFiles(uploads || []);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load task.");
      navigate('/serviceuser/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [taskId]);

  const updateStatus = async (newStatus: string) => {
    if (!task) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('service_user_tasks')
        .update({ task_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', task.id);

      if (error) throw error;
      
      setTask({ ...task, task_status: newStatus });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      
      if (newStatus === 'completed') {
        navigate('/serviceuser/dashboard');
      }
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleFileUpload = async () => {
    if (newFiles.length === 0) return toast.error("Please select a file first.");
    setUpdating(true);

    try {
      for (const file of newFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${task?.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('service-uploads')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('service-uploads')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('service_user_uploads').insert({
          task_id: task?.id,
          service_user_id: task?.service_user_id,
          file_url: urlData.publicUrl,
          file_type: file.type.startsWith('image/') ? 'image' : 'document',
          description: uploadNote || "Task evidence"
        });

        if (dbError) throw dbError;
      }

      toast.success("Files uploaded successfully");
      setNewFiles([]);
      setUploadNote("");
      fetchTask();

    } catch (err: any) {
      console.error(err);
      toast.error("Upload failed: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary"/></div>;
  if (!task) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/serviceuser/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-semibold">Task Details</span>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <h1 className="text-xl font-bold">{task.title}</h1>
                <Badge variant={task.task_status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                    {task.task_status.replace('_', ' ')}
                </Badge>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {/* ✅ FIXED: address_line1 */}
                    <span>{task.properties?.property_name}, {task.properties?.address_line1} {task.rooms && `(Room ${task.rooms.room_number})`}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>Due: {format(parseISO(task.due_date), 'PPP')}</span>
                </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap">
                {task.description || "No additional instructions provided."}
            </div>
        </div>

        {task.task_status !== 'completed' && task.task_status !== 'verified' && (
            <div className="grid grid-cols-2 gap-3">
                {task.task_status === 'pending' ? (
                    <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => updateStatus('in_progress')} disabled={updating}>
                        {updating ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <PlayCircle className="w-4 h-4 mr-2"/>}
                        Start Task
                    </Button>
                ) : (
                    <Button className="w-full bg-green-600 hover:bg-green-700 col-span-2" onClick={() => updateStatus('completed')} disabled={updating}>
                        {updating ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
                        Mark Completed
                    </Button>
                )}
            </div>
        )}

        <Card>
            <CardContent className="p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Camera className="w-5 h-5 text-gray-500" /> Evidence & Reports
                </h3>

                {task.task_status !== 'completed' && (
                    <div className="mb-6 space-y-3">
                        <div 
                            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-8 h-8 mb-2" />
                            <span className="text-sm">Click to upload photos/docs</span>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            multiple 
                            accept="image/*,.pdf" 
                            onChange={e => e.target.files && setNewFiles(Array.from(e.target.files))}
                        />

                        {newFiles.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {newFiles.map((file, i) => (
                                        <div key={i} className="relative w-20 h-20 shrink-0">
                                            {file.type.startsWith('image/') ? (
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded border" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded border text-xs text-center p-1 overflow-hidden">{file.name}</div>
                                            )}
                                            <button onClick={() => setNewFiles(f => f.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3"/></button>
                                        </div>
                                    ))}
                                </div>
                                <Textarea 
                                    placeholder="Add a note about these files..." 
                                    value={uploadNote} 
                                    onChange={e => setUploadNote(e.target.value)} 
                                />
                                <Button size="sm" onClick={handleFileUpload} disabled={updating}>
                                    {updating && <Loader2 className="animate-spin w-3 h-3 mr-2"/>} Upload Selected
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-3">
                    {uploadedFiles.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No evidence uploaded yet.</p>
                    ) : (
                        uploadedFiles.map((file) => (
                            <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50/50">
                                <div className="w-12 h-12 bg-gray-200 rounded shrink-0 overflow-hidden flex items-center justify-center text-gray-400">
                                    {file.file_type === 'image' ? <img src={file.file_url} className="w-full h-full object-cover" /> : <Upload className="w-6 h-6"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.description || "Uploaded File"}</p>
                                    <p className="text-xs text-gray-400">{format(parseISO(file.created_at), 'd MMM yyyy, HH:mm')}</p>
                                </div>
                                <a href={file.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                            </div>
                        ))
                    )}
                </div>

            </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default ServiceUserTasks;