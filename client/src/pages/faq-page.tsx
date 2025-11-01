import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FaqProduct, FaqItem } from "@shared/schema";
import { HelpCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useRealtime } from "@/hooks/use-realtime";

export default function FaqPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  
  // Enable real-time updates
  useRealtime();

  const { data: products, isLoading: loadingProducts } = useQuery<FaqProduct[]>({
    queryKey: ["/api/faq/products"],
  });

  const { data: faqItems, isLoading: loadingItems } = useQuery<FaqItem[]>({
    queryKey: ["/api/faq/items", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return [];
      const response = await fetch(`/api/faq/items/${selectedProductId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch FAQ items");
      return response.json();
    },
    enabled: !!selectedProductId,
  });

  // Auto-select first product if available and none selected
  useMemo(() => {
    if (products && products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  if (loadingProducts) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAQ</h1>
          <p className="text-muted-foreground mt-1">
            Find solutions to common issues
          </p>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAQ</h1>
          <p className="text-muted-foreground mt-1">
            Find solutions to common issues
          </p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No FAQs available yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for helpful information
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">FAQ</h1>
        <p className="text-muted-foreground mt-1">
          Find solutions to common issues
        </p>
      </div>

      <div className="space-y-6">
        {/* Product Selector */}
        <Card>
          <CardHeader className="space-y-0 pb-4">
            <CardTitle className="text-base font-medium">Select Product</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProductId}
              onValueChange={setSelectedProductId}
              data-testid="select-product"
            >
              <SelectTrigger className="w-full max-w-md" data-testid="button-product-selector">
                <SelectValue placeholder="Choose a product..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id} data-testid={`option-product-${product.id}`}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct?.description && (
              <p className="text-sm text-muted-foreground mt-3">
                {selectedProduct.description}
              </p>
            )}
          </CardContent>
        </Card>

        {/* FAQ Items */}
        {selectedProductId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loadingItems ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full mt-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : faqItems && faqItems.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Common Issues & Solutions</CardTitle>
                  <CardDescription>
                    Expand each issue to see the solution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((item, index) => (
                      <AccordionItem 
                        key={item.id} 
                        value={`item-${index}`}
                        data-testid={`accordion-item-${item.id}`}
                      >
                        <AccordionTrigger 
                          className="text-left hover:no-underline"
                          data-testid={`button-toggle-faq-${item.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <span className="font-medium">{item.issue}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent data-testid={`content-faq-${item.id}`}>
                          <div className="pl-8 pt-2 space-y-3">
                            {item.solutions.map((solution, solutionIndex) => (
                              <div 
                                key={solutionIndex} 
                                className="flex items-start gap-3"
                                data-testid={`solution-${item.id}-${solutionIndex}`}
                              >
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-muted-foreground mb-1">
                                    Solution {item.solutions.length > 1 ? `#${solutionIndex + 1}` : ''}
                                  </p>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {solution}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No FAQ items yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check back later for helpful solutions
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
