import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FaqProduct, FaqItem, insertFaqProductSchema, insertFaqItemSchema } from "@shared/schema";
import { Plus, Trash2, Edit, HelpCircle, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRealtime } from "@/hooks/use-realtime";

export default function AdminFaqPage() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<FaqProduct | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FaqProduct | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  useRealtime();

  const { data: products } = useQuery<FaqProduct[]>({
    queryKey: ["/api/faq/products"],
  });

  const { data: faqItems } = useQuery<FaqItem[]>({
    queryKey: ["/api/faq/items", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct) return [];
      const response = await fetch(`/api/faq/items/${selectedProduct.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch FAQ items");
      return response.json();
    },
    enabled: !!selectedProduct,
  });

  // Product form
  const productFormSchema = insertFaqProductSchema.extend({
    displayOrder: z.coerce.number().default(0),
  });

  const productForm = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      displayOrder: 0,
    },
  });

  // FAQ Item form with dynamic solutions
  const itemFormSchema = insertFaqItemSchema.omit({ productId: true }).extend({
    displayOrder: z.coerce.number().default(0),
    solutions: z.array(z.string().min(1, "Solution cannot be empty")).min(1, "At least one solution required"),
  });

  const itemForm = useForm<z.infer<typeof itemFormSchema>>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      issue: "",
      solutions: [""],
      displayOrder: 0,
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productFormSchema>) => {
      return await apiRequest("POST", "/api/admin/faq/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faq/products"] });
      setProductDialogOpen(false);
      productForm.reset();
      toast({ title: "Product created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create product", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<z.infer<typeof productFormSchema>> }) => {
      return await apiRequest("PATCH", `/api/admin/faq/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faq/products"] });
      setProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
      toast({ title: "Product updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/faq/products/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faq/products"] });
      if (selectedProduct?.id === deleteProductId) {
        setSelectedProduct(null);
      }
      setDeleteProductId(null);
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete product", description: error.message, variant: "destructive" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof itemFormSchema>) => {
      if (!selectedProduct) throw new Error("No product selected");
      return await apiRequest("POST", "/api/admin/faq/items", {
        ...data,
        productId: selectedProduct.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faq/items", selectedProduct?.id] });
      setItemDialogOpen(false);
      itemForm.reset({ issue: "", solutions: [""], displayOrder: 0 });
      toast({ title: "FAQ item created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create FAQ item", description: error.message, variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<z.infer<typeof itemFormSchema>> }) => {
      return await apiRequest("PATCH", `/api/admin/faq/items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faq/items", selectedProduct?.id] });
      setItemDialogOpen(false);
      setEditingItem(null);
      itemForm.reset({ issue: "", solutions: [""], displayOrder: 0 });
      toast({ title: "FAQ item updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update FAQ item", description: error.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/faq/items/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faq/items", selectedProduct?.id] });
      setDeleteItemId(null);
      toast({ title: "FAQ item deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete FAQ item", description: error.message, variant: "destructive" });
    },
  });

  const handleProductSubmit = (data: z.infer<typeof productFormSchema>) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleItemSubmit = (data: z.infer<typeof itemFormSchema>) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const openProductDialog = (product?: FaqProduct) => {
    if (product) {
      setEditingProduct(product);
      productForm.reset({
        name: product.name,
        description: product.description || "",
        displayOrder: product.displayOrder,
      });
    } else {
      setEditingProduct(null);
      productForm.reset({ name: "", description: "", displayOrder: 0 });
    }
    setProductDialogOpen(true);
  };

  const openItemDialog = (item?: FaqItem) => {
    if (item) {
      setEditingItem(item);
      itemForm.reset({
        issue: item.issue,
        solutions: item.solutions,
        displayOrder: item.displayOrder,
      });
    } else {
      setEditingItem(null);
      itemForm.reset({ issue: "", solutions: [""], displayOrder: 0 });
    }
    setItemDialogOpen(true);
  };

  const addSolution = () => {
    const current = itemForm.getValues("solutions");
    itemForm.setValue("solutions", [...current, ""]);
  };

  const removeSolution = (index: number) => {
    const current = itemForm.getValues("solutions");
    if (current.length > 1) {
      itemForm.setValue("solutions", current.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">FAQ Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage FAQ products and items
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Products Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription className="mt-1">Manage FAQ product categories</CardDescription>
            </div>
            <Button onClick={() => openProductDialog()} data-testid="button-create-product">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardHeader>
          <CardContent>
            {products && products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product.id}
                      className={selectedProduct?.id === product.id ? "bg-muted" : ""}
                      data-testid={`row-product-${product.id}`}
                    >
                      <TableCell
                        className="cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openProductDialog(product)}
                            data-testid={`button-edit-product-${product.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteProductId(product.id)}
                            data-testid={`button-delete-product-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No products yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ Items Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>FAQ Items</CardTitle>
              <CardDescription className="mt-1">
                {selectedProduct ? `Items for ${selectedProduct.name}` : "Select a product"}
              </CardDescription>
            </div>
            {selectedProduct && (
              <Button onClick={() => openItemDialog()} data-testid="button-create-item">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selectedProduct ? (
              faqItems && faqItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faqItems.map((item) => (
                      <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.issue}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.solutions.length} solution(s)
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openItemDialog(item)}
                              data-testid={`button-edit-item-${item.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteItemId(item.id)}
                              data-testid={`button-delete-item-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No FAQ items yet</p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Select a product to view FAQ items</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent data-testid="dialog-product">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product information" : "Add a new FAQ product category"}
            </DialogDescription>
          </DialogHeader>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-4">
              <FormField
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Roblox External" data-testid="input-product-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief description of this product"
                        data-testid="input-product-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="0"
                        data-testid="input-product-order"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProductDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  data-testid="button-submit-product"
                >
                  {editingProduct ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* FAQ Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-item">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit FAQ Item" : "Create FAQ Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update FAQ item information" : "Add a new FAQ item"}
            </DialogDescription>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(handleItemSubmit)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="issue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue/Question</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="e.g., Akcent stuck on 'Failed to open device, retrying...'"
                        rows={3}
                        data-testid="input-item-issue"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Solutions</FormLabel>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addSolution}
                    data-testid="button-add-solution"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Solution
                  </Button>
                </div>
                {itemForm.watch("solutions").map((_, index) => (
                  <FormField
                    key={index}
                    control={itemForm.control}
                    name={`solutions.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex gap-2">
                          <FormControl className="flex-1">
                            <Textarea
                              {...field}
                              placeholder={`Solution ${index + 1}`}
                              rows={3}
                              data-testid={`input-solution-${index}`}
                            />
                          </FormControl>
                          {itemForm.watch("solutions").length > 1 && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeSolution(index)}
                              data-testid={`button-remove-solution-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <FormField
                control={itemForm.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="0"
                        data-testid="input-item-order"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setItemDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  data-testid="button-submit-item"
                >
                  {editingItem ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent data-testid="dialog-delete-product">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This will also delete all associated FAQ items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductId && deleteProductMutation.mutate(deleteProductId)}
              data-testid="button-confirm-delete-product"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent data-testid="dialog-delete-item">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItemId && deleteItemMutation.mutate(deleteItemId)}
              data-testid="button-confirm-delete-item"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
