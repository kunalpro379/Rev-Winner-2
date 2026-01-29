import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, MessageCircle, Zap, Shield, CheckCircle, Brain, Mic, FileText, Users, Lock, Sparkles, Play, Layers } from "lucide-react";
import { HamburgerNav } from "@/components/hamburger-nav";
import { DemoRequestModal } from "@/components/demo-request-modal";
import { useSEO } from "@/hooks/use-seo";
import { StructuredData, organizationSchema, softwareApplicationSchema, faqSchema } from "@/components/structured-data";
import { RevWinnerChatbot } from "@/components/rev-winner-chatbot";
import { HolidayBanner } from "@/components/holiday-banner";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  
  useSEO({
    title: "Rev Winner - AI Sales Coach for Live Deal Intelligence",
    description: "Win more deals with Rev Winner's AI sales coach. Real-time call coaching, live transcription, BANT tracking, and auto meeting minutes. Start your free trial today.",
    keywords: "Rev Winner, AI sales assistant, conversation intelligence, sales intelligence software, real-time sales coaching, AI-powered sales call feedback, conversation intelligence for sales, revenue intelligence platform, AI sales insights, meeting transcription, AI-generated notes, sales enablement platform, live call coaching software, sales meeting transcription, AI meeting summary, conversation analysis software, sales calls analysis, real-time conversation intelligence, multi-AI engine conversation analytics, sales call objection handling, meeting minutes automation, pitch deck generator, case study generator, battle card automation, sales execution intelligence, revenue productivity platform, AI for sales reps, sales performance feedback, SaaS for sales professionals, B2B sales intelligence, conversation AI assistant, sales automation software, AI sales coach, AI meeting assistant, speech to text for sales, AI call analysis, revenue acceleration software",
    ogTitle: "Rev Winner - AI Sales Coach That Closes Deals",
    ogDescription: "Stop guessing what to say next. Rev Winner gives you real-time AI coaching with live transcription and conversation insights to close more deals.",
    ogImage: "https://revwinner.com/og-image.png",
    ogUrl: "https://revwinner.com/"
  });

  const faqData = [
    {
      question: "What is Rev Winner?",
      answer: "Rev Winner is an AI-powered sales assistant that provides real-time conversation intelligence, live transcription with speaker diarization, automated meeting minutes, and proactive sales coaching to help sales professionals close more deals faster."
    },
    {
      question: "How does the free trial work?",
      answer: "You get 3 free sessions with a total of 180 minutes of usage. No credit card required. After the trial, you can choose from our flexible subscription plans."
    },
    {
      question: "Which AI engines does Rev Winner support?",
      answer: "Rev Winner supports multiple AI providers including OpenAI (GPT-4, GPT-4o), Anthropic Claude, Google Gemini, X.AI Grok, DeepSeek, and Kimi K2. You can bring your own API key for any of these providers."
    },
    {
      question: "Can I use Rev Winner with Zoom, Teams, or Webex?",
      answer: "Yes! Rev Winner supports audio input from any source, including screen share audio from Zoom, Microsoft Teams, and Webex meetings. You can mix microphone input with remote meeting audio using Web Audio API."
    },
    {
      question: "How does the real-time sales coaching work?",
      answer: "During your live sales call, Rev Winner analyzes the conversation in real-time and provides exactly 3 actionable sales tips categorized by type (rebuttal, objection handling, etc.). Our AI responds in under 3 seconds with ultra-fast analysis."
    },
    {
      question: "What kind of meeting minutes can I generate?",
      answer: "Rev Winner generates comprehensive meeting minutes including discussion summary, discovery Q&A, BANT qualification (Budget, Authority, Need, Timeline), challenges identified, key insights/buying signals, action items, and follow-up plans. You can export them as professional PDFs."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, Rev Winner implements enterprise-grade security with encrypted API key storage, single-device access control, JWT-based authentication with refresh tokens, comprehensive audit logging, and all data stored in secure PostgreSQL (Neon serverless) with SSL."
    },
    {
      question: "Can I generate sales materials with Rev Winner?",
      answer: "Yes! Our Present to Win feature auto-generates pitch decks (5 slides), case studies (2-slide visual summaries), and battle cards (competitive comparison tables) based on your conversation context."
    }
  ];

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={softwareApplicationSchema} />
      <StructuredData data={faqSchema(faqData)} />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:bg-gradient-to-br dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
      <HamburgerNav currentPath="/" />
      <HolidayBanner />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600/10 to-pink-600/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-full border border-purple-300/40 dark:border-purple-500/40 mb-8 backdrop-blur-sm">
            <Trophy className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">Rev Winner — Your Real-Time Sales Ally</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold bg-gradient-to-r from-purple-900 via-fuchsia-800 to-pink-800 dark:from-purple-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent mb-6 tracking-tight leading-tight">
            Win More Deals with<br />Real-Time AI Intelligence
          </h1>
          
          <p className="text-xl lg:text-2xl text-slate-700 dark:text-slate-200 mb-4 max-w-3xl mx-auto leading-relaxed font-semibold">
            Stop guessing what to say next.
          </p>
          
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto">
            With Rev Winner, you get real-time sales intelligence – live transcription, instant coaching, and AI insights that help you close more deals, faster.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => setLocation('/register')}
              className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 text-white px-10 py-7 text-xl rounded-full shadow-2xl shadow-purple-500/30 hover:shadow-purple-600/40 transition-all transform hover:scale-105"
              size="lg"
              data-testid="button-start-trial-hero"
            >
              Start Free Trial Now
            </Button>
            <Button 
              onClick={() => setIsDemoModalOpen(true)}
              variant="outline"
              className="px-10 py-7 text-xl rounded-full border-2 border-purple-600 dark:border-purple-400 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all transform hover:scale-105"
              size="lg"
              data-testid="button-request-demo-hero"
            >
              Request a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/10 to-pink-600/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-full border border-purple-300/40 dark:border-purple-500/40 mb-4 backdrop-blur-sm">
            <Play className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">See Rev Winner in Action</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-900 to-pink-800 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
            Watch How It Works
          </h2>
        </div>
        
        <div className="relative bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-3 shadow-2xl shadow-purple-500/20 border border-purple-200/50 dark:border-purple-500/30">
          {/* Video Container with aspect ratio */}
          <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: '56.25%' }}>
            {/* YouTube Embed - No fullscreen, privacy-enhanced, no YouTube branding */}
            <iframe
              src="https://www.youtube-nocookie.com/embed/45z5sqXb6_4?rel=0&modestbranding=1&fs=0&disablekb=0&playsinline=1"
              title="Rev Winner Demo Video"
              className="absolute top-0 left-0 w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              data-testid="video-demo-embed"
            />
            {/* Overlay to block YouTube logo click - positioned at bottom right */}
            <div 
              className="absolute bottom-0 right-0 w-32 h-12 bg-transparent cursor-default z-10"
              onClick={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              data-testid="video-youtube-blocker"
            />
          </div>
        </div>
      </section>

      {/* Why Sales Pros Love Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-900 to-pink-800 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent mb-6">
            Why Sales Pros Love Rev Winner
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl">
                <Brain className="w-7 h-7 text-purple-700 dark:text-purple-400 flex-shrink-0" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Hear. Think. Win.</h3>
                <p className="text-slate-600 dark:text-slate-300">The AI listens, analyzes, and tells you what to say next.</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 rounded-xl">
                <Mic className="w-7 h-7 text-pink-700 dark:text-pink-400 flex-shrink-0" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Never Miss a Detail</h3>
                <p className="text-slate-600 dark:text-slate-300">Real-time transcripts capture every buyer cue.</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-fuchsia-100 to-purple-100 dark:from-fuchsia-900/50 dark:to-purple-900/50 rounded-xl">
                <Zap className="w-7 h-7 text-fuchsia-700 dark:text-fuchsia-400 flex-shrink-0" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Instant Coaching</h3>
                <p className="text-slate-600 dark:text-slate-300">Get 3 smart, live tips while you're on the call.</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl">
                <Trophy className="w-7 h-7 text-purple-700 dark:text-purple-400 flex-shrink-0" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Close with Confidence</h3>
                <p className="text-slate-600 dark:text-slate-300">AI detects buying signals and guides your next move.</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-100 to-fuchsia-100 dark:from-pink-900/50 dark:to-fuchsia-900/50 rounded-xl">
                <MessageCircle className="w-7 h-7 text-pink-700 dark:text-pink-400 flex-shrink-0" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Waiting. No Setup.</h3>
                <p className="text-slate-600 dark:text-slate-300">Works right inside your browser.</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50 rounded-xl">
                <Layers className="w-7 h-7 text-violet-700 dark:text-violet-400 flex-shrink-0" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sales Assets. Instantly.</h3>
                <p className="text-slate-600 dark:text-slate-300">Battle cards, case studies & pitch decks—crafted live, unique to your deal.</p>
              </div>
            </div>
          </Card>

        </div>

        <div className="text-center mt-12">
          <p className="text-xl text-slate-700 dark:text-slate-200 mb-8 italic">
            "One call with Rev Winner, and you'll never go back."
          </p>
          <Button 
            onClick={() => setLocation('/register')}
            className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-full shadow-xl shadow-purple-500/30"
            size="lg"
            data-testid="button-signup-features"
          >
            Sign Up Free Now – Get 3 Sessions Free
          </Button>
        </div>
      </section>

      {/* Guaranteed Sales Advantage */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="bg-white/60 dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-purple-950/60 backdrop-blur-md border border-purple-200/50 dark:border-purple-500/30 rounded-3xl p-12 shadow-2xl shadow-purple-500/10">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-900 to-pink-800 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent mb-6">
              Guaranteed Sales Advantage
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-200 max-w-3xl mx-auto mb-4 font-semibold">
              Rev Winner isn't another note-taking app.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              It's your AI sales coach that thinks faster than your competition — and helps your team operate like pros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl mb-4">
                <CheckCircle className="w-10 h-10 text-green-700 dark:text-green-400" />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-medium">Reduce your dependency on Sales Engineers by <span className="text-purple-700 dark:text-purple-400 font-bold">40 to 50 percent</span>.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl mb-4">
                <CheckCircle className="w-10 h-10 text-green-700 dark:text-green-400" />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-medium">Empower every rep to handle technical and business questions instantly.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl mb-4">
                <CheckCircle className="w-10 h-10 text-green-700 dark:text-green-400" />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-medium">Make your sales team self-sufficient and confident in real-time conversations.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-8 mb-8 border border-purple-200/50 dark:border-purple-500/20 shadow-lg">
            <p className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">Sales teams using Rev Winner report:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">40%</p>
                <p className="text-slate-700 dark:text-slate-300 font-semibold">shorter sales cycles</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 dark:from-fuchsia-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">2×</p>
                <p className="text-slate-700 dark:text-slate-300 font-semibold">more qualified meetings</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">3×</p>
                <p className="text-slate-700 dark:text-slate-300 font-semibold">higher close confidence</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg text-slate-700 dark:text-slate-200 mb-6 font-medium">
              If your sales calls don't improve after the first 3 sessions — <span className="text-purple-700 dark:text-purple-400 font-bold">you pay nothing</span>.
            </p>
            <Button 
              onClick={() => setLocation('/register')}
              className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-full shadow-xl shadow-purple-500/30 font-semibold"
              size="lg"
              data-testid="button-start-trial-guarantee"
            >
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* What You Get - Features Table */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-900 to-pink-800 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent mb-6">
            What You Get
          </h2>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-purple-200/50 dark:divide-purple-500/30">
            <div className="p-8 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-lg">
                  <Mic className="w-6 h-6 text-purple-700 dark:text-purple-400 flex-shrink-0" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Real-Time Transcription</h3>
                  <p className="text-slate-600 dark:text-slate-300">Never miss what prospects say</p>
                </div>
              </div>
            </div>

            <div className="p-8 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-fuchsia-100 to-purple-100 dark:from-fuchsia-900/50 dark:to-purple-900/50 rounded-lg">
                  <Zap className="w-6 h-6 text-fuchsia-700 dark:text-fuchsia-400 flex-shrink-0" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Coaching</h3>
                  <p className="text-slate-600 dark:text-slate-300">Handle objections in seconds</p>
                </div>
              </div>
            </div>

            <div className="p-8 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 rounded-lg">
                  <FileText className="w-6 h-6 text-pink-700 dark:text-pink-400 flex-shrink-0" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Meeting Minutes</h3>
                  <p className="text-slate-600 dark:text-slate-300">Get follow-up notes instantly</p>
                </div>
              </div>
            </div>

            <div className="p-8 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/50 dark:to-fuchsia-900/50 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-700 dark:text-purple-400 flex-shrink-0" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Multi-AI Support</h3>
                  <p className="text-slate-600 dark:text-slate-300">Works with OpenAI, Claude, Grok, DeepSeek, Gemini, Kimi K2</p>
                </div>
              </div>
            </div>

            <div className="p-8 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-lg">
                  <Lock className="w-6 h-6 text-green-700 dark:text-green-400 flex-shrink-0" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Bring Your Own AI Key</h3>
                  <p className="text-slate-600 dark:text-slate-300">Full control — use your own API keys</p>
                </div>
              </div>
            </div>

            <div className="p-8 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-pink-700 dark:text-pink-400 flex-shrink-0" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Assistance on Demand</h3>
                  <p className="text-slate-600 dark:text-slate-300">Ask questions anytime — get instant answers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Trust */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-white/80 to-green-50/50 dark:from-slate-900/80 dark:to-emerald-950/40 backdrop-blur-md border border-green-200/50 dark:border-green-500/30 rounded-3xl p-12 shadow-2xl shadow-green-500/10">
          <div className="text-center">
            <div className="inline-flex p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-3xl mb-6 shadow-lg">
              <Shield className="w-14 h-14 text-green-700 dark:text-green-400" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 dark:from-green-300 dark:to-emerald-300 bg-clip-text text-transparent mb-6">
              Privacy and Trust
            </h2>
            
            <div className="max-w-3xl mx-auto space-y-4 text-lg text-slate-700 dark:text-slate-200">
              <p className="font-bold text-slate-900 dark:text-white text-xl">Your data belongs to you, not us.</p>
              <p>Rev Winner does not store any session data.</p>
              <p>All API keys are AES-256 encrypted, and your transcripts remain private on your device.</p>
              <p className="font-bold text-green-700 dark:text-green-400 text-xl">No recordings. No leaks. No tracking.</p>
              <p className="text-xl text-slate-900 dark:text-white font-bold mt-6">We respect your privacy – always.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Sales Leaders */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-3xl mb-6 shadow-lg">
            <Users className="w-14 h-14 text-purple-700 dark:text-purple-400" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-900 to-pink-800 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent mb-6">
            Built for Sales Leaders Who Refuse to Lose
          </h2>
          
          <p className="text-xl text-slate-700 dark:text-slate-200 mb-4 font-medium">
            Whether you're a solo closer or managing a 100-rep team,
          </p>
          <p className="text-xl text-slate-700 dark:text-slate-200 mb-8 font-medium">
            Rev Winner keeps your sales game sharp, consistent, and scalable.
          </p>
          
          <div className="bg-white/60 dark:bg-gradient-to-r dark:from-purple-950/50 dark:to-slate-900/50 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 rounded-2xl p-8 mb-8 shadow-xl">
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Predictable performance. Real-time mastery.</p>
            <p className="text-lg text-slate-700 dark:text-slate-300 font-semibold">Built by Sales Professionals. For Sales Professionals.</p>
          </div>
          
          <Button 
            onClick={() => setLocation('/register')}
            className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 text-white px-10 py-7 text-xl rounded-full shadow-2xl shadow-purple-500/30"
            size="lg"
            data-testid="button-signup-leaders"
          >
            Sign Up Now — It's Free to Start
          </Button>
        </div>
      </section>

      {/* Works With Every AI */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-3xl mb-6 shadow-lg">
            <Sparkles className="w-14 h-14 text-purple-700 dark:text-purple-400" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-900 to-pink-800 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent mb-6">
            Works With Every AI You Love
          </h2>
          
          <p className="text-xl text-slate-700 dark:text-slate-200 mb-8 max-w-3xl mx-auto">
            Plug in your favorite engine — <span className="text-purple-700 dark:text-purple-400 font-bold">OpenAI, Claude, Grok, DeepSeek, Gemini, or Kimi K2</span> — and let Rev Winner handle the rest.
          </p>
          
          <div className="bg-white/60 dark:bg-gradient-to-br dark:from-purple-950/40 dark:to-slate-900/40 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 rounded-2xl p-8 max-w-2xl mx-auto mb-8 shadow-xl">
            <p className="text-lg text-slate-900 dark:text-white mb-2 font-bold">Your voice. Your data. Your rules.</p>
            <p className="text-slate-700 dark:text-slate-300 font-semibold">The power of enterprise AI without losing control.</p>
          </div>
        </div>
      </section>

      {/* A Word from the Founder */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-900 to-pink-800 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent mb-4">
              A Word from the Founder
            </h2>
            <p className="text-xl text-slate-800 dark:text-slate-200 font-semibold">Sandeep Sharma</p>
            <p className="text-lg text-slate-600 dark:text-slate-300">Founder, Rev Winner (A Product from Healthcaa Technologies)</p>
          </div>

          <div className="bg-white/60 dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-purple-950/60 backdrop-blur-md border border-purple-200/50 dark:border-purple-500/30 rounded-2xl p-8 lg:p-12 shadow-2xl shadow-purple-500/10">
            <div className="space-y-4 text-lg text-slate-700 dark:text-slate-200 leading-relaxed">
              <p>
                "I always felt the pain of losing deals – not because of lack of effort, but because I couldn't address customer questions in time.
                The dependency on Sales Engineers and Managers was frustrating because their availability rarely matched my urgency.
              </p>
              <p>
                So, I built a solution for myself – to answer technical and non-technical queries instantly, reducing my dependency and boosting my confidence.
                It worked like magic. Suddenly, I was making better recommendations, handling objections with ease, and closing more deals.
              </p>
              <p>
                Now, I'm bringing this same solution to the sales community.
                I built Rev Winner because I know what it takes to close sales – the stress, the hustle, and the need for control.
                The intent is simple: empower and enable sales professionals everywhere.
              </p>
              <p className="font-semibold text-slate-900 dark:text-white">
                I've kept the pricing intentionally affordable so more sales professionals can navigate deal closures with lesser dependency.
                Let's go out there and bring those closures home."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 mb-20">
        <div className="relative bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 rounded-3xl p-16 text-center shadow-2xl shadow-purple-500/30 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-6xl font-extrabold text-white mb-6">
              Ready to Win More Deals?
            </h2>
            
            <p className="text-2xl text-white/95 mb-4 max-w-3xl mx-auto">
              Don't wait for the perfect pitch.
            </p>
            <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
              Create it in real time with Rev Winner.
            </p>
            
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 max-w-2xl mx-auto mb-10 border border-white/30 shadow-xl">
              <p className="text-2xl font-bold text-white mb-2">3 Free Sessions. No Credit Card. No Excuses.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button 
                onClick={() => setLocation('/register')}
                className="bg-white text-purple-700 hover:bg-purple-50 px-12 py-8 text-2xl rounded-full shadow-2xl font-bold transform hover:scale-105 transition-all"
                size="lg"
                data-testid="button-final-cta"
              >
                Be a Rev Winner Today
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-200/50 dark:border-purple-500/20 bg-white/30 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* About the Company Section */}
          <div className="mb-12">
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-4">About Rev Winner</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  <strong className="text-slate-900 dark:text-white">Rev Winner</strong> is an AI-powered sales assistant platform developed by <strong className="text-slate-900 dark:text-white">Healthcaa Technologies</strong>, a technology company based in Lucknow, India. Since 2024, we've been empowering sales professionals worldwide with real-time conversation intelligence, live transcription, and AI-driven insights to close more deals.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Our platform supports multi-AI engines (OpenAI, Anthropic Claude, Google Gemini, X.AI Grok, DeepSeek, Kimi K2) and provides enterprise-grade security with encrypted API key storage, single-device access control, and comprehensive audit logging.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Our Expertise</h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Real-time sales coaching with 3-second AI response times</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Live transcription with multi-speaker identification (Deepgram integration)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Automated meeting minutes with BANT qualification</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Professional sales materials (pitch decks, case studies, battle cards)</span>
                  </li>
                </ul>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
                  📍 Location: Lucknow, Uttar Pradesh, India
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  📞 USA/Canada: <a href="tel:+18326328555" className="text-purple-600 dark:text-purple-400 hover:underline">+1 (832) 632-8555</a> • India: <a href="tel:+918130276382" className="text-purple-600 dark:text-purple-400 hover:underline">+91 8130276382</a>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-purple-200/50 dark:border-purple-500/20 pt-8 mb-8"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setLocation('/')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-home">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation('/blog')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-blog">
                    Blog
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation('/contact')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-contact">
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setLocation('/ai-sales-assistant')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-app">
                    Rev Winner App
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation('/packages')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-pricing">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation('/register')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-trial">
                    Start Free Trial
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setLocation('/terms')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-terms">
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation('/privacy-policy')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-privacy">
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-sitemap">
                    Sitemap
                  </a>
                </li>
                <li>
                  <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-robots">
                    Robots.txt
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-purple-200/50 dark:border-purple-500/20 pt-8 text-center text-slate-600 dark:text-slate-400">
            <p>© 2025 Rev Winner. All rights reserved.</p>
            <p className="text-sm mt-2">A Product from Healthcaa Technologies</p>
          </div>
        </div>
      </footer>
    </div>
    
    {/* Floating AI Chatbot - Ask anything about Rev Winner */}
    <RevWinnerChatbot />
    
    <DemoRequestModal 
      open={isDemoModalOpen} 
      onOpenChange={setIsDemoModalOpen} 
    />
    </>
  );
}
