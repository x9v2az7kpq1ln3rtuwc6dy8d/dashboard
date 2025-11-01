import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DownloadFile, fileCategories } from "@shared/schema";
import { Download, FileText, Loader2, Search, Filter, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useRealtime } from "@/hooks/use-realtime";

export default function DownloadsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Enable real-time updates for files
  useRealtime();

  const { data: files, isLoading } = useQuery<DownloadFile[]>({
    queryKey: ["/api/files"],
  });

  // Filter and search files
  const filteredFiles = useMemo(() => {
    if (!files) return [];
    
    return files.filter((file) => {
      const matchesSearch = 
        searchQuery === "" ||
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        categoryFilter === "all" || 
        file.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [files, searchQuery, categoryFilter]);

  const { data: favorites = [] } = useQuery<{ fileId: string }[]>({
    queryKey: ["/api/favorites"],
  });

  const favoritesSet = new Set(favorites.map((f) => f.fileId));

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ fileId, isFavorited }: { fileId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        return apiRequest("DELETE", `/api/favorites/${fileId}`);
      } else {
        return apiRequest("POST", `/api/favorites/${fileId}`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await apiRequest("POST", `/api/files/${fileId}/download`, {});
      const blob = await res.blob();
      return { blob, fileId };
    },
    onSuccess: ({ blob, fileId }) => {
      const file = files?.find((f) => f.id === fileId);
      if (file) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download started",
          description: `Downloading ${file.name}`,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
          <p className="text-muted-foreground mt-1">
            Access your available files
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
        <p className="text-muted-foreground mt-1">
          Access your available files
        </p>
      </motion.div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-files"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {fileCategories.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!files || files.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No files available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              There are currently no files available for download. Check back later or contact your administrator.
            </p>
          </CardContent>
        </Card>
        </motion.div>
      ) : filteredFiles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No files found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                No files match your search criteria. Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredFiles.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
            <Card data-testid={`card-file-${file.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="flex-1">{file.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="capitalize">
                      {file.category}
                    </Badge>
                    {file.version && (
                      <Badge variant="secondary">
                        v{file.version}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {file.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">File Size</span>
                  <span className="font-mono">{formatFileSize(file.fileSize)}</span>
                </div>
                {file.updatedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Updated</span>
                    <span>{formatDistanceToNow(new Date(file.updatedAt), { addSuffix: true })}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleFavoriteMutation.mutate({ fileId: file.id, isFavorited: favoritesSet.has(file.id) })}
                  disabled={toggleFavoriteMutation.isPending}
                  data-testid={`button-favorite-${file.id}`}
                >
                  <Heart
                    className={`h-4 w-4 ${favoritesSet.has(file.id) ? "fill-current text-red-500" : ""}`}
                  />
                </Button>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    className="w-full"
                    onClick={() => downloadMutation.mutate(file.id)}
                    disabled={downloadMutation.isPending}
                    data-testid={`button-download-${file.id}`}
                  >
                    {downloadMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardFooter>
            </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
