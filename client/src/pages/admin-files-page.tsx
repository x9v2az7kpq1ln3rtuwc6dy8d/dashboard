import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadFile, userRoles, fileCategories } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Trash2, Upload, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { z } from "zod";
import { useRealtime } from "@/hooks/use-realtime";

const uploadFileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  version: z.string().optional(),
  category: z.string().default("other"),
  allowedRoles: z.array(z.string()).min(1, "At least one role must be selected"),
  file: z.instanceof(File).refine((file) => file.size > 0, "File is required"),
});

const editFileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  version: z.string().optional(),
  category: z.string().default("other"),
});

type UploadFileData = z.infer<typeof uploadFileSchema>;
type EditFileData = z.infer<typeof editFileSchema>;

export default function AdminFilesPage() {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingFile, setEditingFile] = useState<DownloadFile | null>(null);
  
  useRealtime();

  const { data: files, isLoading } = useQuery<DownloadFile[]>({
    queryKey: ["/api/admin/files"],
  });

  const uploadForm = useForm<UploadFileData>({
    resolver: zodResolver(uploadFileSchema),
    defaultValues: {
      name: "",
      description: "",
      version: "",
      category: "other",
      allowedRoles: ["customer", "moderator", "admin"],
      file: undefined as any,
    },
  });

  const editForm = useForm<EditFileData>({
    resolver: zodResolver(editFileSchema),
    defaultValues: {
      name: "",
      description: "",
      version: "",
      category: "other",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFileData) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      if (data.version) formData.append("version", data.version);
      formData.append("category", data.category);
      formData.append("allowedRoles", JSON.stringify(data.allowedRoles));

      const res = await fetch("/api/admin/files", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Upload failed");
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File uploaded",
        description: "File has been uploaded successfully",
      });
      setIsUploadDialogOpen(false);
      uploadForm.reset();
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: EditFileData & { fileId: string }) => {
      return await apiRequest("PATCH", `/api/admin/files/${data.fileId}`, {
        category: data.category,
        name: data.name,
        description: data.description,
        version: data.version,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File updated",
        description: "File has been updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingFile(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiRequest("DELETE", `/api/admin/files/${fileId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File deleted",
        description: "File has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      uploadForm.setValue("file", file);
      if (!uploadForm.getValues("name")) {
        uploadForm.setValue("name", file.name);
      }
    }
  };

  const handleEditClick = (file: DownloadFile) => {
    setEditingFile(file);
    editForm.reset({
      name: file.name,
      description: file.description || "",
      version: file.version || "",
      category: file.category,
    });
    setIsEditDialogOpen(true);
  };

  const onUploadSubmit = (data: UploadFileData) => {
    uploadMutation.mutate(data);
  };

  const onEditSubmit = (data: EditFileData) => {
    if (editingFile) {
      editMutation.mutate({ ...data, fileId: editingFile.id });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-9 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Management</h1>
          <p className="text-muted-foreground mt-1">Upload and manage downloadable files</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-file">
              <Plus className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New File</DialogTitle>
              <DialogDescription>Upload a new file for customers to download</DialogDescription>
            </DialogHeader>
            <Form {...uploadForm}>
              <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-4">
                <FormField
                  control={uploadForm.control}
                  name="file"
                  render={({ field: { value, ...field } }) => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            {...field}
                            type="file"
                            onChange={handleFileChange}
                            data-testid="input-file-upload"
                          />
                          {selectedFile && (
                            <p className="text-sm text-muted-foreground">
                              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                            </p>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={uploadForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="My Awesome File" data-testid="input-file-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={uploadForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="File description..." rows={3} data-testid="textarea-file-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={uploadForm.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1.0.0" data-testid="input-file-version" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={uploadForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-file-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fileCategories.map((cat) => (
                              <SelectItem key={cat} value={cat} className="capitalize">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={uploadForm.control}
                  name="allowedRoles"
                  render={() => (
                    <FormItem>
                      <FormLabel>Allowed Roles</FormLabel>
                      <FormDescription>Select which roles can access this file</FormDescription>
                      <div className="space-y-2">
                        {userRoles.map((role) => (
                          <FormField
                            key={role}
                            control={uploadForm.control}
                            name="allowedRoles"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(role)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, role])
                                        : field.onChange(field.value?.filter((value) => value !== role));
                                    }}
                                    data-testid={`checkbox-role-${role}`}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal capitalize">{role}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={uploadMutation.isPending} data-testid="button-submit-upload">
                    {uploadMutation.isPending ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-pulse" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit File Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit File</DialogTitle>
              <DialogDescription>Update file details and category</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="My Awesome File" data-testid="input-edit-file-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="File description..." rows={3} data-testid="textarea-edit-file-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1.0.0" data-testid="input-edit-file-version" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-file-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fileCategories.map((cat) => (
                              <SelectItem key={cat} value={cat} className="capitalize">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={editMutation.isPending} data-testid="button-submit-edit">
                    {editMutation.isPending ? "Updating..." : "Update File"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>Manage all uploaded files</CardDescription>
        </CardHeader>
        <CardContent>
          {!files || files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No files uploaded</h3>
              <p className="text-sm text-muted-foreground">Upload your first file to get started</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Allowed Roles</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id} data-testid={`row-file-${file.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {file.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{file.version || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatFileSize(file.fileSize)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {file.allowedRoles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs capitalize">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(file)}
                            data-testid={`button-edit-${file.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(file.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${file.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
