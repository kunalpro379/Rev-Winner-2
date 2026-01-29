import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, Edit, Eye, CheckCircle, Clock, Plus, Save, X } from "lucide-react";

interface TermsVersion {
  id: string;
  title: string;
  content: string;
  version: string;
  isActive: boolean;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface TermsFormData {
  title: string;
  content: string;
  version: string;
}

export function TermsManagement() {
  const { toast } = useToast();
  const [activeTerms, setActiveTerms] = useState<TermsVersion | null>(null);
  const [allVersions, setAllVersions] = useState<TermsVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState<TermsVersion | null>(null);
  const [formData, setFormData] = useState<TermsFormData>({
    title: "",
    content: "",
    version: ""
  });

  useEffect(() => {
    fetchTermsData();
  }, []);

  const fetchTermsData = async () => {
    try {
      setLoading(true);
      
      // Fetch active terms and all versions
      const [activeResponse, versionsResponse] = await Promise.all([
        fetch("/api/admin/terms", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
          }
        }),
        fetch("/api/admin/terms/versions", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
          }
        })
      ]);

      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        setActiveTerms(activeData.terms);
      }

      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json();
        setAllVersions(versionsData.versions || []);
      }
    } catch (error) {
      console.error("Error fetching terms data:", error);
      toast({
        title: "Error",
        description: "Failed to load terms data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTerms = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.version.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/admin/terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Terms and conditions created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({ title: "", content: "", version: "" });
        fetchTermsData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create terms",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating terms:", error);
      toast({
        title: "Error",
        description: "Failed to create terms",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTerms = async () => {
    if (!selectedTerms || !formData.title.trim() || !formData.content.trim() || !formData.version.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/terms/${selectedTerms.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Terms and conditions updated successfully",
        });
        setIsEditDialogOpen(false);
        setSelectedTerms(null);
        setFormData({ title: "", content: "", version: "" });
        fetchTermsData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update terms",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating terms:", error);
      toast({
        title: "Error",
        description: "Failed to update terms",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleActivateTerms = async (termsId: string) => {
    try {
      const response = await fetch(`/api/admin/terms/${termsId}/activate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Terms version activated successfully",
        });
        fetchTermsData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to activate terms",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error activating terms:", error);
      toast({
        title: "Error",
        description: "Failed to activate terms",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setFormData({ title: "Terms & Conditions", content: "", version: "1.0" });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (terms: TermsVersion) => {
    setSelectedTerms(terms);
    setFormData({
      title: terms.title,
      content: terms.content,
      version: terms.version
    });
    setIsEditDialogOpen(true);
  };

  const openPreviewDialog = (terms: TermsVersion) => {
    setSelectedTerms(terms);
    setIsPreviewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Terms & Conditions Management</h2>
          <p className="text-muted-foreground">
            Manage your platform's terms and conditions with a rich text editor
          </p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Version
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Terms</TabsTrigger>
          <TabsTrigger value="versions">All Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTerms ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {activeTerms.title}
                    </CardTitle>
                    <CardDescription>
                      Version {activeTerms.version} • Last updated: {formatDate(activeTerms.updatedAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPreviewDialog(activeTerms)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(activeTerms)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40 w-full rounded border p-4">
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {activeTerms.content.substring(0, 500)}
                    {activeTerms.content.length > 500 && "..."}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No active terms and conditions found</p>
                  <Button onClick={openCreateDialog} className="mt-2">
                    Create First Version
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          {allVersions.length > 0 ? (
            <div className="grid gap-4">
              {allVersions.map((terms) => (
                <Card key={terms.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{terms.title}</CardTitle>
                        <CardDescription>
                          Version {terms.version} • Created: {formatDate(terms.createdAt)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {terms.isActive ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPreviewDialog(terms)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(terms)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {!terms.isActive && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Activate
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Activate Terms Version</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will make version {terms.version} the active terms and conditions.
                                  The current active version will be deactivated.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleActivateTerms(terms.id)}>
                                  Activate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No terms versions found</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Terms & Conditions</DialogTitle>
            <DialogDescription>
              Create a new version of your terms and conditions. This will become the active version.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Terms & Conditions"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter your terms and conditions content here..."
                    className="min-h-[400px] font-mono text-sm resize-none"
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleCreateTerms} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Creating..." : "Create Terms"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Terms & Conditions</DialogTitle>
            <DialogDescription>
              Edit the selected terms and conditions version.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Terms & Conditions"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-version">Version</Label>
                    <Input
                      id="edit-version"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-content">Content</Label>
                  <Textarea
                    id="edit-content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter your terms and conditions content here..."
                    className="min-h-[400px] font-mono text-sm resize-none"
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleUpdateTerms} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Updating..." : "Update Terms"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedTerms?.title}</DialogTitle>
            <DialogDescription>
              Version {selectedTerms?.version} • Last updated: {selectedTerms && formatDate(selectedTerms.updatedAt)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[60vh] w-full rounded border p-4">
              <div className="whitespace-pre-wrap text-sm">
                {selectedTerms?.content}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}