import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Brain, FileText, Zap, BarChart3, MessageCircle, PresentationIcon, Package, Sparkles, ClipboardList, Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeatureGuideProps {
  onExportFull: () => void;
  onExportQuick: () => void;
  isExportingFull: boolean;
  isExportingQuick: boolean;
}

export default function FeatureGuide({ onExportFull, onExportQuick, isExportingFull, isExportingQuick }: FeatureGuideProps) {
  return (
    <section id="feature-guide">
      <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl" data-testid="title-feature-guide">
                <Zap className="h-6 w-6 text-purple-600" />
                Feature Guide
              </CardTitle>
              <CardDescription data-testid="desc-feature-guide">
                Complete guide to all Rev Winner features - functionality, benefits, and how to use them
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={onExportQuick}
                variant="outline"
                size="sm"
                disabled={isExportingQuick}
                data-testid="button-export-quick-reference"
                className="border-purple-300 dark:border-purple-700"
              >
                {isExportingQuick ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Quick Reference PDF
                  </>
                )}
              </Button>
              <Button
                onClick={onExportFull}
                variant="default"
                size="sm"
                disabled={isExportingFull}
                data-testid="button-export-full-documentation"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isExportingFull ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Full Guide PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* 1. Domain Expertise */}
            <AccordionItem value="domain-expertise">
              <AccordionTrigger data-testid="accordion-domain-expertise">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  Domain Expertise
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">What It Does</h4>
                    <p>Train the AI on your specific product knowledge, case studies, and company documentation. Create up to 5 domain expertise profiles (with Train Me add-on) and upload up to 100 documents per profile including PDFs, Word docs, and URLs.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">Key Benefits</h4>
                    <ul>
                      <li><strong>Accuracy:</strong> AI responses grounded in your actual product information</li>
                      <li><strong>Domain-Specific:</strong> Focuses exclusively on your expertise area</li>
                      <li><strong>Customizable:</strong> Tailor AI behavior to different products or market segments</li>
                      <li><strong>Knowledge Base:</strong> Build comprehensive product information repository</li>
                      <li><strong>Consistency:</strong> All sales reps get the same accurate information</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">How to Use</h4>
                    <ol>
                      <li>Navigate to <strong>Train Me</strong> page from sidebar</li>
                      <li>Purchase "Train Me" add-on (if not already active)</li>
                      <li>Click "Create New Domain" button</li>
                      <li>Enter domain name (e.g., "Cloud Infrastructure Solutions")</li>
                      <li>Upload documents (PDF, DOC, DOCX, TXT) or add URLs</li>
                      <li>Monitor processing status (Pending → Processing → Completed)</li>
                      <li>Select your domain before sales calls</li>
                      <li>AI automatically uses your training materials in all responses</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Live Transcripts */}
            <AccordionItem value="live-transcripts">
              <AccordionTrigger data-testid="accordion-live-transcripts">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Live Transcripts
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">What It Does</h4>
                    <p>Provides real-time speech-to-text conversion of your sales calls, capturing every word with multi-speaker identification, timestamps, and auto-scrolling display.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">Key Benefits</h4>
                    <ul>
                      <li><strong>Focus on Conversation:</strong> No need to take notes manually</li>
                      <li><strong>Accurate Records:</strong> Every word captured for later review</li>
                      <li><strong>Context Preservation:</strong> See entire conversation flow at a glance</li>
                      <li><strong>AI Foundation:</strong> Provides data for all other AI features</li>
                      <li><strong>Compliance:</strong> Complete record of what was discussed</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">How to Use</h4>
                    <ol>
                      <li>Navigate to <strong>Sales Assistant</strong> page</li>
                      <li>Click "Start Recording" or enable audio input</li>
                      <li>Speak naturally - transcription begins automatically</li>
                      <li>AI identifies speakers (You / Prospect)</li>
                      <li>Each message appears in real-time with timestamp</li>
                      <li>Transcript auto-scrolls to show latest content</li>
                      <li>Stop recording when call ends</li>
                      <li>Use transcript for analysis, minutes, or follow-up</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Shift Gears */}
            <AccordionItem value="shift-gears">
              <AccordionTrigger data-testid="accordion-shift-gears">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  Shift Gears
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">What It Does</h4>
                    <p>Your real-time sales coach providing instant strategic guidance during live conversations. Analyzes dialogue and suggests next steps, talking points, and sales strategies to drive toward closure.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">Key Benefits</h4>
                    <ul>
                      <li><strong>Real-Time Coaching:</strong> Get guidance while conversation is happening</li>
                      <li><strong>Confidence Boost:</strong> Never feel stuck or unsure what to say next</li>
                      <li><strong>Objection Handling:</strong> Suggested responses to prospect concerns</li>
                      <li><strong>Closure Focus:</strong> Guidance toward demo booking or next steps</li>
                      <li><strong>Junior Rep Enablement:</strong> Helps less experienced reps perform like veterans</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">How to Use</h4>
                    <ol>
                      <li>Start your sales call with Live Transcript running</li>
                      <li><strong>Shift Gears</strong> panel appears automatically on right side</li>
                      <li>As conversation develops, AI analyzes context</li>
                      <li>Strategic tips appear automatically (15-30 words, action-oriented)</li>
                      <li><strong>Query Pitch Generator:</strong> Type prospect's question → Generate one-liner response</li>
                      <li>Use AI guidance to navigate conversation strategically</li>
                      <li>Always keep panel expanded for quick access during calls</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Conversation Analysis */}
            <AccordionItem value="conversation-analysis">
              <AccordionTrigger data-testid="accordion-conversation-analysis">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  Conversation Analysis (On Demand)
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">What It Does</h4>
                    <p>Provides comprehensive AI-powered analysis delivering deep insights into pain points, requirements, BANT qualification status, and 5-10 strategic discovery questions - all generated on-demand when you need it.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">Key Benefits</h4>
                    <ul>
                      <li><strong>Deep Understanding:</strong> AI extracts insights you might miss</li>
                      <li><strong>Qualification Clarity:</strong> Know exactly where you stand on BANT</li>
                      <li><strong>Question Bank:</strong> 5-10 strategic discovery questions prioritized by impact</li>
                      <li><strong>Product Match:</strong> Know which products/services fit prospect's needs</li>
                      <li><strong>Continuous Updates:</strong> Regenerate as conversation evolves</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">How to Use</h4>
                    <ol>
                      <li>During or after sales call, locate <strong>Conversation Analysis</strong> section</li>
                      <li>Click header to expand section</li>
                      <li>Click "Analyze Conversation" button</li>
                      <li>Review Discovery Insights (pain points, requirements, environment)</li>
                      <li>Check BANT Qualification status (Budget, Authority, Need, Timeline)</li>
                      <li>Use 5-10 strategic discovery questions in conversation</li>
                      <li>Review recommended products/services and case studies</li>
                      <li>Click "Regenerate" as conversation evolves for updated insights</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 5. Sales Assistant Q&A */}
            <AccordionItem value="sales-assistant-qa">
              <AccordionTrigger data-testid="accordion-sales-assistant-qa">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-purple-600" />
                  Sales Assistant Q&A
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">What It Does</h4>
                    <p>Your always-available AI companion during calls. Ask any question about products, how to handle objections, or what to say next, and get instant, domain-specific responses based on your training materials.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">Key Benefits</h4>
                    <ul>
                      <li><strong>Instant Answers:</strong> Get information without leaving the call</li>
                      <li><strong>Expert-Level Responses:</strong> AI trained on your specific materials</li>
                      <li><strong>Objection Handling:</strong> Real-time help overcoming concerns</li>
                      <li><strong>Product Details:</strong> Access specifications without searching docs</li>
                      <li><strong>Confidence:</strong> Know you have backup for any question</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">How to Use</h4>
                    <ol>
                      <li>Locate <strong>Sales Assistant Q&A</strong> panel during call</li>
                      <li>Type your question (e.g., "What's our pricing for enterprise plan?")</li>
                      <li>Press Enter or click "Ask" button</li>
                      <li>AI response appears instantly (1-2 seconds)</li>
                      <li>Use AI guidance in your conversation</li>
                      <li>Ask during natural pauses for best flow</li>
                      <li>AI remembers conversation context for tailored responses</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 6. Present to Win */}
            <AccordionItem value="present-to-win">
              <AccordionTrigger data-testid="accordion-present-to-win">
                <div className="flex items-center gap-2">
                  <PresentationIcon className="h-4 w-4 text-purple-600" />
                  Present to Win (Pitch Deck, Case Study, Battle Card)
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">What It Does</h4>
                    <p>AI-powered sales collateral generator creating three key materials on-demand: a compelling Pitch Deck (5 slides), a relevant Case Study, and a competitive Battle Card - all based on your actual conversation.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">Key Benefits</h4>
                    <ul>
                      <li><strong>Personalized Materials:</strong> Every asset tailored to this specific prospect</li>
                      <li><strong>Time Savings:</strong> Generate in seconds what takes hours manually</li>
                      <li><strong>Conversation-Driven:</strong> Based on actual pain points discussed</li>
                      <li><strong>Competitive Edge:</strong> Battle Card gives you talking points vs competitors</li>
                      <li><strong>Follow-Up Ready:</strong> Use materials in post-call emails</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">How to Use</h4>
                    <ol>
                      <li>Locate <strong>Present to Win</strong> section (full-width below Conversation Analysis)</li>
                      <li><strong>Pitch Deck:</strong> Click tab → Generate → Review 5-slide presentation</li>
                      <li><strong>Case Study:</strong> Click tab → Generate → Get success story matching their needs</li>
                      <li><strong>Battle Card:</strong> Click tab → Generate → Receive competitive positioning guide</li>
                      <li>Click individual "Regenerate" buttons as conversation evolves</li>
                      <li>Copy/export materials for follow-up emails</li>
                      <li>Share with prospect or use internally</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 7. Product/Service Reference */}
            <AccordionItem value="product-reference">
              <AccordionTrigger data-testid="accordion-product-reference">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  Product/Service Reference
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">What It Does</h4>
                    <p>Provides a searchable catalog of your products, services, and modules with detailed descriptions. Visual highlighting shows AI-recommended solutions for quick reference during calls.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">Key Benefits</h4>
                    <ul>
                      <li><strong>Quick Access:</strong> Find any product/service in seconds</li>
                      <li><strong>AI Guidance:</strong> See which products AI recommends for this prospect</li>
                      <li><strong>No Memorization:</strong> Don't need to remember entire catalog</li>
                      <li><strong>Professional:</strong> Reference exact names and codes</li>
                      <li><strong>Cross-Selling:</strong> Discover related offerings</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">How to Use</h4>
                    <ol>
                      <li>Locate <strong>Product/Service Reference</strong> panel in sidebar</li>
                      <li>Click header to expand if collapsed</li>
                      <li>Type in search box to filter products in real-time</li>
                      <li>Search by code, name, or description</li>
                      <li>Cards with gold/yellow border = AI-recommended for this prospect</li>
                      <li>Review product code, name, and detailed description</li>
                      <li>Reference exact product names during conversation</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 8. Product/Service Recommendation */}
            <AccordionItem value="product-recommendation">
              <AccordionTrigger data-testid="accordion-product-recommendation">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Product/Service Recommendation
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">What It Does</h4>
                    <p>AI's intelligent matching engine that analyzes your conversation and automatically suggests the most relevant products, services, case studies, and talking points based on prospect's stated needs and pain points.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">Key Benefits</h4>
                    <ul>
                      <li><strong>Perfect Matching:</strong> AI finds best-fit solutions from your catalog</li>
                      <li><strong>No Guessing:</strong> Data-driven recommendations, not hunches</li>
                      <li><strong>Case Study Relevance:</strong> Get social proof that actually applies</li>
                      <li><strong>Talking Points:</strong> Pre-written one-liners for each recommendation</li>
                      <li><strong>Cross-Sell Opportunities:</strong> Discover complementary products</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">How to Use</h4>
                    <ol>
                      <li>Have conversation with prospect through Live Transcript or Sales Assistant Q&A</li>
                      <li>Discuss their challenges, needs, and current environment</li>
                      <li>After 4+ message exchanges with pain points AND requirements identified</li>
                      <li>AI automatically generates recommendations in multiple places:
                        <ul>
                          <li><strong>Shift Gears</strong> panel: Quick suggestions to mention</li>
                          <li><strong>Conversation Analysis:</strong> Full list under "Recommended Solutions"</li>
                          <li><strong>Product/Service Reference:</strong> Highlighted items (gold border)</li>
                        </ul>
                      </li>
                      <li>Review AI-suggested products and verify match against stated needs</li>
                      <li>Use provided one-liners or adapt as needed</li>
                      <li>Reference case studies if prospect asks for proof</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 9. Meeting Minutes */}
            <AccordionItem value="meeting-minutes">
              <AccordionTrigger data-testid="accordion-meeting-minutes">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-purple-600" />
                  Meeting Minutes
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">What It Does</h4>
                    <p>AI-powered meeting documentation system that automatically generates comprehensive, structured minutes from your sales conversation. Captures all critical information and exports as a professional PDF document.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">Key Benefits</h4>
                    <ul>
                      <li><strong>No Manual Note-Taking:</strong> AI captures everything automatically</li>
                      <li><strong>Professional Documentation:</strong> Consistent, structured format</li>
                      <li><strong>Stakeholder Sharing:</strong> Send to management, team members</li>
                      <li><strong>CRM Updates:</strong> Complete record for sales pipeline</li>
                      <li><strong>Accountability:</strong> Clear action items and owners</li>
                      <li><strong>Time Savings:</strong> Generate in seconds vs 30+ minutes manually</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">How to Use</h4>
                    <ol>
                      <li>System automatically tracks call start time, duration, and conversation content</li>
                      <li>After call ends, locate <strong>Meeting Minutes</strong> panel in sidebar</li>
                      <li>Click "Generate Minutes" button</li>
                      <li>AI processes entire conversation (5-10 seconds)</li>
                      <li>Review generated minutes with all sections:
                        <ul>
                          <li>Meeting header (date, time, duration, attendees)</li>
                          <li>Discussion summary</li>
                          <li>Discovery Q&A</li>
                          <li>BANT qualification details</li>
                          <li>Challenges and key insights</li>
                          <li>Action items with owners and deadlines</li>
                          <li>Follow-up plan</li>
                        </ul>
                      </li>
                      <li>Click "Export PDF" button</li>
                      <li>PDF downloads as: Meeting_Minutes_MM_DD_YYYY.pdf</li>
                      <li>Share with prospect, team, or attach to CRM</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Feature Integration Workflow */}
            <AccordionItem value="feature-integration">
              <AccordionTrigger data-testid="accordion-feature-integration">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Feature Integration & Typical Call Flow
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">How Features Work Together</h4>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="mb-2 font-medium">Complete Integration Flow:</p>
                      <ol className="space-y-1 text-sm">
                        <li><strong>Domain Expertise</strong> → Trains AI on your products</li>
                        <li><strong>Live Transcripts</strong> → Captures conversation</li>
                        <li><strong>Shift Gears & Sales Q&A</strong> → Real-time assistance</li>
                        <li><strong>Conversation Analysis</strong> → Extracts insights</li>
                        <li><strong>Product Recommendations</strong> → Suggests solutions</li>
                        <li><strong>Product Reference</strong> → Provides details</li>
                        <li><strong>Present to Win</strong> → Creates sales materials</li>
                        <li><strong>Meeting Minutes</strong> → Documents everything</li>
                      </ol>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">Typical Call Flow</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                        <strong className="text-purple-600 dark:text-purple-400">BEFORE CALL:</strong>
                        <p className="text-sm mt-1">Set up Domain Expertise with product materials (one-time setup)</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                        <strong className="text-purple-600 dark:text-purple-400">CALL START:</strong>
                        <p className="text-sm mt-1">Enable Live Transcripts → Select your domain</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                        <strong className="text-purple-600 dark:text-purple-400">DURING CALL:</strong>
                        <p className="text-sm mt-1">Reference Shift Gears for coaching → Use Sales Assistant Q&A as needed → Check Product Reference</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                        <strong className="text-purple-600 dark:text-purple-400">MID-CALL:</strong>
                        <p className="text-sm mt-1">Generate Conversation Analysis for strategic insights</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                        <strong className="text-purple-600 dark:text-purple-400">LATE CALL:</strong>
                        <p className="text-sm mt-1">Review Product Recommendations → Create Present to Win materials</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                        <strong className="text-purple-600 dark:text-purple-400">POST-CALL:</strong>
                        <p className="text-sm mt-1">Generate Meeting Minutes → Export PDF → Send follow-up email</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">Power User Tips</h4>
                    <ul className="text-sm space-y-1">
                      <li>✓ Set Domain Expertise before first call</li>
                      <li>✓ Keep Shift Gears visible during calls</li>
                      <li>✓ Regenerate Analysis & Present to Win as conversation evolves</li>
                      <li>✓ Use Q&A liberally - ask AI anything</li>
                      <li>✓ Export Meeting Minutes immediately post-call</li>
                      <li>✓ Trust AI recommendations (gold borders)</li>
                      <li>✓ Send PDFs within 24 hours for professionalism</li>
                      <li>✓ Copy Query Pitch one-liners for quick responses</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
