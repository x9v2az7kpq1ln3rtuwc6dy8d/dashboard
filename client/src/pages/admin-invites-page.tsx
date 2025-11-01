import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InviteCode, userRoles } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, Plus, Copy, Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AdminInvitesPage() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("customer");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: inviteCodes, isLoading } = useQuery<InviteCode[]>({
    queryKey: ["/api/admin/invite-codes"],
  });

  const generateCodeMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await apiRequest("POST", "/api/admin/invite-codes", { role });
      return await res.json();
    },
    onSuccess: (newCode: InviteCode) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invite-codes"] });
      toast({
        title: "Invite code generated",
        description: `New ${newCode.role} invite code created`,
      });
      setIsDialogOpen(false);
      setCopiedCode(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCodeMutation = useMutation({
    mutationFn: async (codeId: string) => {
      await apiRequest("DELETE", `/api/admin/invite-codes/${codeId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invite-codes"] });
      toast({
        title: "Invite code deleted",
        description: "The invite code has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    generateCodeMutation.mutate(selectedRole);
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Copied to clipboard",
        description: "Invite code has been copied",
      });

      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite Codes</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage invite codes
          </p>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usedCodes = inviteCodes?.filter((c) => c.isUsed).length || 0;
  const unusedCodes = inviteCodes?.filter((c) => !c.isUsed).length || 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite Codes</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage invite codes
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-generate-code">
              <Plus className="h-4 w-4 mr-2" />
              Generate Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Invite Code</DialogTitle>
              <DialogDescription>
                Create a new invite code with a specific role assignment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role" data-testid="select-generate-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Users who register with this code will be assigned the {selectedRole} role
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel-generate"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateCodeMutation.isPending}
                data-testid="button-confirm-generate"
              >
                {generateCodeMutation.isPending ? "Generating..." : "Generate Code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-codes">
              {inviteCodes?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-unused-codes">
              {unusedCodes}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-used-codes">
              {usedCodes}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invite Codes</CardTitle>
          <CardDescription>
            View and manage all generated invite codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!inviteCodes || inviteCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Key className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No invite codes</h3>
              <p className="text-sm text-muted-foreground">
                Generate your first invite code to get started
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Used At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inviteCodes.map((code) => (
                    <TableRow key={code.id} data-testid={`row-code-${code.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {code.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleCopy(code.code)}
                            data-testid={`button-copy-${code.id}`}
                          >
                            {copiedCode === code.code ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{code.role}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={code.isUsed ? "secondary" : "default"}>
                          {code.isUsed ? "Used" : "Available"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {code.createdAt
                          ? formatDistanceToNow(new Date(code.createdAt), { addSuffix: true })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {code.usedAt
                          ? formatDistanceToNow(new Date(code.usedAt), { addSuffix: true })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {!code.isUsed && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteCodeMutation.mutate(code.id)}
                            disabled={deleteCodeMutation.isPending}
                            data-testid={`button-delete-${code.id}`}
                          >
                            Delete
                          </Button>
                        )}
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
