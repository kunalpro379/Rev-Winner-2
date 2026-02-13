import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, FileText, BookOpen, Target, Loader2, RefreshCw, Download, Copy, Mail } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PitchDeck } from "./pitch-deck.tsx";
import { CaseStudy } from "./case-study.tsx";
import { BattleCard } from "./battle-card.tsx";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { exportPitchDeckToPDF, exportBattleCardToPDF, exportCaseStudyToPDF, exportPresentToWinToPDF } from "@/utils/pdfExport";

type ContentType = "pitch-deck" | "case-study" | "battle-card" | null;

interface PresentToWinProps {
  sessionId: string;
  conversationContext: string;
  domainExpertise: string;
  resetVersion?: number;
  multiProductEliteAI?: boolean;
}

export function PresentToWin({ sessionId, conversationContext, domainExpertise, resetVersion = 0, multiProductEliteAI = false }: PresentToWinProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedType, setSelectedType] = useState<ContentType>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const { toast } = useToast();
  
  // Reset all local state when parent triggers new session
  useEffect(() => {
    if (resetVersion > 0) {
      setSelectedType(null);
      setIsGenerating(false);
      setGeneratedContent(null);
    }
  }, [resetVersion]);

  const handleGenerate = async (type: ContentType) => {
    if (!conversationContext || conversationContext.trim().length === 0) {
      toast({
        title: "No conversation data",
        description: "Please start a conversation before generating sales materials.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setSelectedType(type);
    setGeneratedContent(null);

    try {
      const response = await apiRequest("POST", "/api/present-to-win/generate", {
        type,
        conversationContext,
        domainExpertise,
        sessionId,
        multiProductEliteAI
      });

      const data = await response.json();
      setGeneratedContent(data);
      
      const productCount = data._multiProduct && data.products ? data.products.length : 1;
      const productLabel = productCount > 1 ? ` (${productCount} products detected)` : "";
      
      toast({
        title: "Content generated",
        description: `Your ${type === 'pitch-deck' ? 'Pitch Deck' : type === 'case-study' ? 'Case Study' : 'Battle Card'} is ready!${productLabel}`,
      });
    } catch (error: any) {
      // Parse error message from API response
      let errorMessage = "Failed to generate content. Please try again.";
      
      if (error.message) {
        // Error format from apiRequest: "STATUS: JSON_BODY" or "STATUS: text"
        const match = error.message.match(/^\d+:\s*(.+)$/);
        if (match) {
          try {
            const jsonError = JSON.parse(match[1]);
            errorMessage = jsonError.message || jsonError.error || errorMessage;
          } catch {
            // If not JSON, use the text after status code
            errorMessage = match[1];
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive"
      });
      setSelectedType(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!generatedContent || !selectedType) return;
    
    try {
      // Handle multi-product exports
      if (generatedContent._multiProduct && generatedContent.products && generatedContent.products.length > 1) {
        // For multi-product, we need to export each tab separately
        const tabs = document.querySelectorAll('[data-testid^="tab-product-"]');
        
        for (let i = 0; i < generatedContent.products.length; i++) {
          const product = generatedContent.products[i];
          const tab = tabs[i] as HTMLElement;
          
          if (tab) {
            // Click the tab to make it active
            tab.click();
            
            // Wait for content to render
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Export with product-specific name
            await exportPresentToWinToPDF(selectedType, product.productName);
          }
        }
        
        toast({
          title: "PDFs Exported",
          description: `${generatedContent.products.length} ${selectedType === 'pitch-deck' ? 'pitch deck' : selectedType === 'case-study' ? 'case study' : 'battle card'} PDFs downloaded`,
        });
      } else {
        // Single product export
        await exportPresentToWinToPDF(selectedType, domainExpertise);
        
        toast({
          title: "PDF Exported",
          description: `${selectedType === 'pitch-deck' ? 'Pitch deck' : selectedType === 'case-study' ? 'Case study' : 'Battle card'} downloaded with UI screenshots`,
        });
      }
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    if (!generatedContent || !selectedType) return;
    
    let textContent = '';
    
    if (selectedType === 'pitch-deck') {
      textContent = `${domainExpertise} - Pitch Deck\n\n`;
      if (generatedContent.slides) {
        generatedContent.slides.forEach((slide: any, index: number) => {
          textContent += `Slide ${index + 1}: ${slide.title}\n`;
          if (slide.highlight) textContent += `${slide.highlight}\n`;
          if (slide.content) {
            slide.content.forEach((point: string) => {
              textContent += `• ${point}\n`;
            });
          }
          textContent += '\n';
        });
      }
    } else if (selectedType === 'battle-card') {
      textContent = `${domainExpertise} - Battle Card\n\n`;
      textContent += `${generatedContent.yourProduct} vs ${generatedContent.competitor1 || 'Competition'}\n\n`;
      if (generatedContent.technicalAdvantages) {
        textContent += 'Technical Advantages:\n';
        generatedContent.technicalAdvantages.forEach((adv: string) => {
          textContent += `✓ ${adv}\n`;
        });
        textContent += '\n';
      }
      if (generatedContent.whyChooseUs) {
        textContent += `Why Choose Us:\n${generatedContent.whyChooseUs}\n`;
      }
    } else if (selectedType === 'case-study') {
      textContent = `${domainExpertise} - Case Study\n\n`;
      textContent += `${generatedContent.title}\n\n`;
      textContent += `Customer: ${generatedContent.customer}\n`;
      textContent += `Industry: ${generatedContent.industry}\n\n`;
      textContent += `Challenge:\n${generatedContent.challenge}\n\n`;
      textContent += `Solution:\n${generatedContent.solution}\n\n`;
      if (generatedContent.outcomes) {
        textContent += 'Results:\n';
        generatedContent.outcomes.forEach((outcome: any) => {
          textContent += `• ${outcome.value} - ${outcome.metric}\n`;
        });
      }
    }
    
    navigator.clipboard.writeText(textContent);
    toast({
      title: "Copied to Clipboard",
      description: "Content copied as formatted text",
    });
  };

  // Share via email
  const handleShareEmail = () => {
    if (!generatedContent || !selectedType) return;
    
    const typeLabel = selectedType === 'pitch-deck' ? 'Pitch Deck' : 
                      selectedType === 'battle-card' ? 'Battle Card' : 'Case Study';
    const subject = `${domainExpertise} - ${typeLabel}`;
    
    let body = `Hi,\n\nI wanted to share this ${typeLabel} for ${domainExpertise}.\n\n`;
    
    // Add brief preview
    if (selectedType === 'pitch-deck' && generatedContent.slides && generatedContent.slides.length > 0) {
      body += `This ${generatedContent.slides.length}-slide presentation covers:\n`;
      generatedContent.slides.forEach((slide: any) => {
        body += `• ${slide.title}\n`;
      });
    } else if (selectedType === 'battle-card') {
      body += `Competitive analysis: ${generatedContent.yourProduct} vs ${generatedContent.competitor1 || 'Competition'}\n`;
    } else if (selectedType === 'case-study') {
      body += `${generatedContent.title}\n`;
    }
    
    body += `\nBest regards`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="shadow-lg border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/30 dark:to-pink-950/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-purple-50/70 dark:hover:bg-purple-950/40 transition-all pb-4 border-b border-purple-200/50 dark:border-purple-800/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 rounded-lg shadow-md hover:scale-105 transition-transform">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                    Present to Win
                  </CardTitle>
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                    Auto-generate sales materials from your conversation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedType && !isGenerating && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium">
                    {selectedType === 'pitch-deck' ? 'Pitch Deck' : selectedType === 'case-study' ? 'Case Study' : 'Battle Card'}
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-6">
            {/* Option Buttons */}
            {!selectedType && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleGenerate("pitch-deck")}
                  disabled={isGenerating}
                  variant="outline"
                  className="h-auto flex-col items-start p-6 border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all group"
                  data-testid="button-generate-pitch-deck"
                >
                  <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-lg mb-2">Pitch Deck</h3>
                  <p className="text-xs text-muted-foreground text-left">
                    5-slide mini presentation tailored to your conversation
                  </p>
                </Button>

                <Button
                  onClick={() => handleGenerate("case-study")}
                  disabled={isGenerating}
                  variant="outline"
                  className="h-auto flex-col items-start p-6 border-2 hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/50 transition-all group"
                  data-testid="button-generate-case-study"
                >
                  <BookOpen className="h-8 w-8 text-pink-600 dark:text-pink-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-lg mb-2">Case Study</h3>
                  <p className="text-xs text-muted-foreground text-left">
                    2-slide problem-solution-outcome summary
                  </p>
                </Button>

                <Button
                  onClick={() => handleGenerate("battle-card")}
                  disabled={isGenerating}
                  variant="outline"
                  className="h-auto flex-col items-start p-6 border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all group"
                  data-testid="button-generate-battle-card"
                >
                  <Target className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-lg mb-2">Battle Card</h3>
                  <p className="text-xs text-muted-foreground text-left">
                    Competitive comparison with key differentiators
                  </p>
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600 dark:text-purple-400" />
                <p className="text-sm text-muted-foreground">
                  Generating your {selectedType === 'pitch-deck' ? 'Pitch Deck' : selectedType === 'case-study' ? 'Case Study' : 'Battle Card'}...
                </p>
              </div>
            )}

            {/* Generated Content */}
            {!isGenerating && selectedType && generatedContent && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="font-semibold text-lg">
                    {selectedType === 'pitch-deck' ? 'Your Pitch Deck' : selectedType === 'case-study' ? 'Your Case Study' : 'Your Battle Card'}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Share Buttons */}
                    <Button
                      onClick={handleExportPDF}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950"
                      data-testid="button-export-pdf"
                    >
                      <Download className="h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button
                      onClick={handleCopyToClipboard}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950"
                      data-testid="button-copy-text"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Text
                    </Button>
                    <Button
                      onClick={handleShareEmail}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950"
                      data-testid="button-share-email"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                    <Button
                      onClick={() => handleGenerate(selectedType)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      data-testid={`button-regenerate-${selectedType}`}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedType(null);
                        setGeneratedContent(null);
                      }}
                      variant="outline"
                      size="sm"
                      data-testid="button-back-to-options"
                    >
                      Back to Options
                    </Button>
                  </div>
                </div>

                {/* Multi-Product Tabs or Single Product Display */}
                {generatedContent._multiProduct && generatedContent.products && generatedContent.products.length > 1 && 
                 generatedContent.products.every((p: any) => p.content) ? (
                  <Tabs defaultValue={generatedContent.products[0].productCode} className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
                      {generatedContent.products.map((product: any) => (
                        <TabsTrigger
                          key={product.productCode}
                          value={product.productCode}
                          className="flex items-center gap-2 whitespace-nowrap"
                          data-testid={`tab-product-${product.productCode}`}
                        >
                          {product.productName}
                          <Badge variant={product.confidence === "high" ? "default" : "secondary"} className="text-xs">
                            {Math.round((product.confidence === "high" ? 95 : product.confidence === "medium" ? 75 : 60))}%
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {generatedContent.products.map((product: any) => (
                      <TabsContent key={product.productCode} value={product.productCode} className="mt-4">
                        {selectedType === 'pitch-deck' && product.content?.slides && (
                          <PitchDeck slides={product.content.slides} />
                        )}
                        {selectedType === 'case-study' && (
                          product.content?.title ? (
                            <CaseStudy data={product.content} />
                          ) : product.content?.slides ? (
                            <CaseStudy slides={product.content.slides} />
                          ) : null
                        )}
                        {selectedType === 'battle-card' && product.content && (
                          <BattleCard data={product.content} />
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  // Single-product display (backward compatible or fallback)
                  <>
                    {selectedType === 'pitch-deck' && generatedContent.slides && (
                      <PitchDeck slides={generatedContent.slides} />
                    )}
                    {selectedType === 'case-study' && (
                      generatedContent.title ? (
                        <CaseStudy data={generatedContent} />
                      ) : generatedContent.slides ? (
                        <CaseStudy slides={generatedContent.slides} />
                      ) : null
                    )}
                    {selectedType === 'battle-card' && !generatedContent._multiProduct && (
                      <BattleCard data={generatedContent} />
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
