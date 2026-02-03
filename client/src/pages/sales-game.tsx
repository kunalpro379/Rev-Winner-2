import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Target, Sparkles, CheckCircle, Star, Zap, Award, PartyPopper, Rocket, Download, Share2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { SiLinkedin } from "react-icons/si";
import { Link } from "wouter";
import revWinnerLogoUrl from "@assets/rev-winner-logo.png";

interface LeadInfo {
  name: string;
  company: string;
  email: string;
  phone: string;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

type GamePhase = "lead-capture" | "loading-questions" | "playing" | "results";


const owlCharacter = (
  <svg viewBox="0 0 120 140" className="w-full h-full">
    <defs>
      <linearGradient id="owlBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient id="owlBelly" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C4B5FD" />
        <stop offset="100%" stopColor="#A78BFA" />
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="85" rx="45" ry="50" fill="url(#owlBody)" />
    <ellipse cx="60" cy="95" rx="30" ry="35" fill="url(#owlBelly)" />
    <circle cx="40" cy="60" r="18" fill="white" />
    <circle cx="80" cy="60" r="18" fill="white" />
    <circle cx="42" cy="62" r="10" fill="#1F2937" />
    <circle cx="78" cy="62" r="10" fill="#1F2937" />
    <circle cx="44" cy="59" r="4" fill="white" />
    <circle cx="80" cy="59" r="4" fill="white" />
    <path d="M55 75 L60 85 L65 75" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
    <path d="M25 45 Q20 20 40 40" fill="url(#owlBody)" />
    <path d="M95 45 Q100 20 80 40" fill="url(#owlBody)" />
    <ellipse cx="35" cy="110" rx="12" ry="8" fill="#F59E0B" />
    <ellipse cx="85" cy="110" rx="12" ry="8" fill="#F59E0B" />
    <path d="M30 50 Q35 45 42 52" stroke="#6366F1" strokeWidth="3" fill="none" />
    <path d="M90 50 Q85 45 78 52" stroke="#6366F1" strokeWidth="3" fill="none" />
  </svg>
);

const celebrationOwl = (
  <svg viewBox="0 0 120 140" className="w-full h-full">
    <defs>
      <linearGradient id="owlBodyCeleb" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="85" rx="45" ry="50" fill="url(#owlBodyCeleb)" />
    <ellipse cx="60" cy="95" rx="30" ry="35" fill="#C4B5FD" />
    <circle cx="40" cy="60" r="18" fill="white" />
    <circle cx="80" cy="60" r="18" fill="white" />
    <circle cx="42" cy="62" r="10" fill="#1F2937" />
    <circle cx="78" cy="62" r="10" fill="#1F2937" />
    <circle cx="44" cy="59" r="4" fill="white" />
    <circle cx="80" cy="59" r="4" fill="white" />
    <path d="M55 75 L60 85 L65 75" fill="#F59E0B" />
    <path d="M25 45 Q20 20 40 40" fill="url(#owlBodyCeleb)" />
    <path d="M95 45 Q100 20 80 40" fill="url(#owlBodyCeleb)" />
    <ellipse cx="35" cy="110" rx="12" ry="8" fill="#F59E0B" />
    <ellipse cx="85" cy="110" rx="12" ry="8" fill="#F59E0B" />
    <path d="M45 88 Q60 95 75 88" stroke="#6366F1" strokeWidth="3" fill="none" />
    <path d="M10 60 L5 40 M10 55 L0 50 M10 65 L2 70" stroke="#F59E0B" strokeWidth="2" />
    <path d="M110 60 L115 40 M110 55 L120 50 M110 65 L118 70" stroke="#F59E0B" strokeWidth="2" />
  </svg>
);

const thinkingOwl = (
  <svg viewBox="0 0 120 140" className="w-full h-full">
    <defs>
      <linearGradient id="owlBodyThink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="85" rx="45" ry="50" fill="url(#owlBodyThink)" />
    <ellipse cx="60" cy="95" rx="30" ry="35" fill="#C4B5FD" />
    <circle cx="40" cy="60" r="18" fill="white" />
    <circle cx="80" cy="60" r="18" fill="white" />
    <circle cx="44" cy="62" r="10" fill="#1F2937" />
    <circle cx="82" cy="62" r="10" fill="#1F2937" />
    <circle cx="46" cy="59" r="4" fill="white" />
    <circle cx="84" cy="59" r="4" fill="white" />
    <path d="M55 75 L60 85 L65 75" fill="#F59E0B" />
    <path d="M25 45 Q20 20 40 40" fill="url(#owlBodyThink)" />
    <path d="M95 45 Q100 20 80 40" fill="url(#owlBodyThink)" />
    <ellipse cx="35" cy="110" rx="12" ry="8" fill="#F59E0B" />
    <ellipse cx="85" cy="110" rx="12" ry="8" fill="#F59E0B" />
    <path d="M48 88 L72 88" stroke="#6366F1" strokeWidth="3" />
    <circle cx="95" cy="25" r="8" fill="none" stroke="#F59E0B" strokeWidth="2" />
    <text x="92" y="29" fontSize="10" fill="#F59E0B">?</text>
  </svg>
);

const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    animate={{
      y: [0, -10, 0],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
    }}
  >
    {children}
  </motion.div>
);

const Confetti = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-3 h-3 rounded-sm"
        style={{
          left: `${Math.random() * 100}%`,
          backgroundColor: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][i % 5],
        }}
        initial={{ y: -20, opacity: 1, rotate: 0 }}
        animate={{
          y: 500,
          opacity: [1, 1, 0],
          rotate: Math.random() * 360,
        }}
        transition={{
          duration: 2 + Math.random() * 2,
          delay: Math.random() * 0.5,
          repeat: Infinity,
          repeatDelay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

interface CertificateProps {
  name: string;
  score: number;
  totalQuestions: number;
  company: string;
}

const Certificate = ({ name, score, totalQuestions, company }: CertificateProps) => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const percentage = Math.round((score / totalQuestions) * 100);
  
  const getTitle = () => {
    if (percentage >= 90) return "Sales Master";
    if (percentage >= 70) return "Sales Expert";
    if (percentage >= 50) return "Sales Professional";
    return "Sales Challenger";
  };
  
  return (
    <div 
      style={{ 
        width: '700px', 
        height: '500px',
        background: '#ffffff',
        padding: '0',
        borderRadius: '0',
        border: '2px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Georgia, serif'
      }}
    >
      {/* Purple corner brackets - Top Left */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', width: '60px', height: '60px', borderTop: '4px solid #7c3aed', borderLeft: '4px solid #7c3aed', zIndex: 1 }} />
      {/* Purple corner brackets - Top Right */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', width: '60px', height: '60px', borderTop: '4px solid #7c3aed', borderRight: '4px solid #7c3aed', zIndex: 1 }} />
      {/* Purple corner brackets - Bottom Left */}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '60px', height: '60px', borderBottom: '4px solid #7c3aed', borderLeft: '4px solid #7c3aed', zIndex: 1 }} />
      {/* Purple corner brackets - Bottom Right */}
      <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '60px', height: '60px', borderBottom: '4px solid #7c3aed', borderRight: '4px solid #7c3aed', zIndex: 1 }} />
      
      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', padding: '40px 50px' }}>
        
        {/* Logo */}
        <img 
          src={revWinnerLogoUrl} 
          alt="Rev Winner" 
          style={{ height: '50px', marginBottom: '16px', objectFit: 'contain' }}
          crossOrigin="anonymous"
        />
        
        {/* Title */}
        <h2 style={{ fontSize: '28px', fontWeight: '400', color: '#7c3aed', marginBottom: '20px', letterSpacing: '0.02em', fontFamily: 'Georgia, serif' }}>Certificate of Completion</h2>
        
        {/* Subtitle */}
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px', fontFamily: 'Arial, sans-serif' }}>This certificate acknowledges that</p>
        
        {/* Name in brackets */}
        <div style={{ 
          border: '2px solid #7c3aed', 
          padding: '12px 40px', 
          marginBottom: '8px',
          background: '#faf5ff'
        }}>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1f2937', margin: 0, fontFamily: 'Georgia, serif' }}>{name}</h1>
        </div>
        
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '12px', fontFamily: 'Arial, sans-serif' }}>
          from <span style={{ fontWeight: 600, color: '#374151' }}>{company}</span>
        </p>
        
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px', fontFamily: 'Arial, sans-serif' }}>has successfully completed</p>
        
        {/* Program name */}
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '16px', fontFamily: 'Georgia, serif' }}>Rev Winner Sales Knowledge Challenge</h3>
        
        {/* Score and badge section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '20px' }}>
          {/* Date */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontFamily: 'Arial, sans-serif' }}>Date of Completion</p>
            <p style={{ fontSize: '14px', color: '#374151', fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>{today}</p>
          </div>
          
          {/* Score */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontFamily: 'Arial, sans-serif' }}>Score Achieved</p>
            <p style={{ fontSize: '14px', color: '#374151', fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>{score} / {totalQuestions}</p>
          </div>
          
          {/* Badge */}
          <div style={{ 
            width: '70px', 
            height: '70px', 
            borderRadius: '50%', 
            background: '#7c3aed', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 6px rgba(124, 58, 237, 0.3)'
          }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Points</span>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ marginTop: 'auto', width: '100%', borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>Certification Level</p>
            <p style={{ fontSize: '14px', color: '#7c3aed', fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>{getTitle()}</p>
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[...Array(10)].map((_, i) => (
              <Star key={i} style={{ width: '14px', height: '14px', color: i < score ? '#eab308' : '#d1d5db', fill: i < score ? '#eab308' : 'transparent' }} />
            ))}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>Issued by</p>
            <p style={{ fontSize: '14px', color: '#7c3aed', fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>Rev Winner</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SalesGame() {
  const { toast } = useToast();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<GamePhase>("lead-capture");
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({
    name: "",
    company: "",
    email: "",
    phone: "",
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ questionId: number; selectedIndex: number; correctIndex: number }[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const generateQuestionsMutation = useMutation({
    mutationFn: async (company: string) => {
      const res = await apiRequest("POST", "/api/game/generate-questions", { company });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to generate questions");
      return data.questions as Question[];
    },
    onSuccess: (questions) => {
      setQuestions(questions);
      setPhase("playing");
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
      setPhase("lead-capture");
    },
  });

  const submitLeadMutation = useMutation({
    mutationFn: async (data: LeadInfo & { score: number; totalQuestions: number }) => {
      const res = await apiRequest("POST", "/api/game/submit-lead", data);
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Failed to submit");
      return resData;
    },
    onSuccess: () => {
      console.log("Lead information sent to sales team");
    },
    onError: (err: Error) => {
      console.error("Failed to send lead info:", err.message);
    },
  });

  const requestDemoMutation = useMutation({
    mutationFn: async (data: LeadInfo & { score: number; totalQuestions: number }) => {
      const res = await apiRequest("POST", "/api/game/request-demo", data);
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Failed to submit");
      return resData;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your demo request has been submitted. We'll be in touch soon!",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to submit demo request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadInfo.name || !leadInfo.company || !leadInfo.email || !leadInfo.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to start the game.",
        variant: "destructive",
      });
      return;
    }
    setPhase("loading-questions");
    
    // Send lead info to sales@revwinner.com when game starts (score 0 initially)
    submitLeadMutation.mutate({
      ...leadInfo,
      score: 0,
      totalQuestions: 10,
    });
    
    generateQuestionsMutation.mutate(leadInfo.company);
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isTransitioning) return;
    setSelectedOption(optionIndex);
    setIsTransitioning(true);

    const currentQuestion = questions[currentQuestionIndex];
    
    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedIndex: optionIndex,
        correctIndex: currentQuestion.correctIndex,
      },
    ]);

    setTimeout(() => {
      setSelectedOption(null);
      setIsTransitioning(false);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setPhase("results");
      }
    }, 800);
  };

  const score = answers.filter((a) => a.selectedIndex === a.correctIndex).length;

  const handleBookDemo = () => {
    requestDemoMutation.mutate({
      ...leadInfo,
      score,
      totalQuestions: questions.length,
    });
  };

  const handleDownloadCertificate = async () => {
    if (!certificateRef.current) return;
    
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: window.devicePixelRatio * 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        scrollY: -window.scrollY,
      });
      
      const filename = `RevWinner-Certificate-${leadInfo.name.replace(/\s+/g, '-')}.png`;
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast({ title: "Download Failed", description: "Could not generate certificate image.", variant: "destructive" });
          return;
        }
        
        // Try native share API first (works best on mobile)
        if (navigator.share && navigator.canShare) {
          try {
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'Rev Winner Sales Certificate',
                text: 'My Sales Knowledge Challenge Certificate!',
              });
              toast({ title: "Certificate Shared!", description: "Your certificate has been shared successfully." });
              return;
            }
          } catch (shareError) {
            // Share cancelled or failed, fall through to download
          }
        }
        
        // Fallback to blob URL download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Certificate Downloaded!",
          description: "Your achievement certificate has been saved.",
        });
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Certificate download error:', error);
      toast({
        title: "Download Failed",
        description: "Could not download the certificate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareLinkedIn = () => {
    const percentage = Math.round((score / questions.length) * 100);
    const title = percentage >= 90 ? "Sales Master" : percentage >= 70 ? "Sales Expert" : percentage >= 50 ? "Sales Professional" : "Sales Challenger";
    
    let achievementMessage = "";
    if (percentage >= 90) {
      achievementMessage = "I'm thrilled to announce that I've achieved the highest distinction in the Rev Winner Sales Knowledge Challenge!";
    } else if (percentage >= 70) {
      achievementMessage = "I'm proud to share that I've demonstrated strong sales expertise in the Rev Winner Sales Knowledge Challenge!";
    } else if (percentage >= 50) {
      achievementMessage = "I've just completed the Rev Winner Sales Knowledge Challenge and validated my growing sales skills!";
    } else {
      achievementMessage = "I've taken on the Rev Winner Sales Knowledge Challenge as part of my commitment to continuous learning in sales!";
    }
    
    const text = `🏆 ${achievementMessage}

 Score: ${score}/${questions.length} | Badge Earned: ${title}

This certification validates my knowledge in:
Sales methodology & best practices
Customer engagement strategies  
Objection handling techniques
Value-based selling approaches

🎯 Ready to put these skills into action and drive results!

Think you have what it takes? Take the challenge yourself and see how you measure up!

#RevWinner #SalesExcellence #ProfessionalDevelopment #SalesCertification #ContinuousLearning #SalesLeadership`;
    
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    
    const copyAndShare = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          toast({
            title: "Message Copied to Clipboard!",
            description: "The share message has been copied. Paste it in your LinkedIn post along with your downloaded certificate!",
          });
        } else {
          toast({
            title: "Share on LinkedIn",
            description: "Download your certificate and share your achievement!",
          });
        }
      } catch {
        toast({
          title: "Share on LinkedIn",
          description: "LinkedIn share window opened. Download your certificate to share your achievement!",
        });
      }
      window.open(linkedInUrl, '_blank', 'width=600,height=600');
    };
    
    copyAndShare();
  };

  const getScoreMessage = () => {
    const percentage = Math.round((score / questions.length) * 100);
    if (percentage >= 90) {
      return {
        title: "Sales Master! 🌟",
        message: "Incredible! You're in the top tier of sales professionals. Rev Winner can help you maintain this excellence!",
        emoji: "🏆",
      };
    } else if (percentage >= 70) {
      return {
        title: "Sales Expert! 👏",
        message: "Impressive knowledge! You've got what it takes. Rev Winner can help you reach mastery level.",
        emoji: "⭐",
      };
    } else if (percentage >= 50) {
      return {
        title: "Great Progress! 💪",
        message: "Solid foundation! Rev Winner's AI coaching will accelerate your journey to becoming a sales expert.",
        emoji: "📈",
      };
    } else {
      return {
        title: "Keep Learning! 🚀",
        message: "Every expert was once a beginner. Rev Winner's AI-powered training will transform your sales skills!",
        emoji: "💡",
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-20">
        <Link href="/sales-challenge">
          <Button variant="ghost" className="text-white/70 hover:text-white" data-testid="back-to-hub">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
        </Link>
      </div>
      <div className="absolute top-10 left-10 opacity-20">
        <FloatingElement delay={0}>
          <Star className="w-8 h-8 text-yellow-400" />
        </FloatingElement>
      </div>
      <div className="absolute top-20 right-20 opacity-20">
        <FloatingElement delay={0.5}>
          <Sparkles className="w-10 h-10 text-purple-400" />
        </FloatingElement>
      </div>
      <div className="absolute bottom-20 left-20 opacity-20">
        <FloatingElement delay={1}>
          <Zap className="w-6 h-6 text-blue-400" />
        </FloatingElement>
      </div>
      <div className="absolute bottom-10 right-10 opacity-20">
        <FloatingElement delay={1.5}>
          <Award className="w-8 h-8 text-pink-400" />
        </FloatingElement>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
          {phase === "lead-capture" && (
            <motion.div
              key="lead-capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-purple-500/30 shadow-2xl overflow-hidden">
                <CardHeader className="text-center relative pb-2">
                  <motion.div 
                    className="mx-auto mb-4 w-28 h-32"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {owlCharacter}
                  </motion.div>
                  <CardTitle className="text-3xl font-bold text-white" data-testid="game-title">
                    Sales Knowledge Challenge
                  </CardTitle>
                  <CardDescription className="text-purple-200 text-lg mt-2">
                    Test your product expertise and earn a shareable certificate!
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <form onSubmit={handleStartGame} className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="name" className="text-purple-200">Your Name</Label>
                      <Input
                        id="name"
                        placeholder="John Smith"
                        value={leadInfo.name}
                        onChange={(e) => setLeadInfo({ ...leadInfo, name: e.target.value })}
                        className="bg-white/10 border-purple-400/50 text-white placeholder:text-purple-300/50 focus:border-purple-400"
                        data-testid="input-name"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="company" className="text-purple-200">Company Name</Label>
                      <Input
                        id="company"
                        placeholder="Acme Corporation"
                        value={leadInfo.company}
                        onChange={(e) => setLeadInfo({ ...leadInfo, company: e.target.value })}
                        className="bg-white/10 border-purple-400/50 text-white placeholder:text-purple-300/50 focus:border-purple-400"
                        data-testid="input-company"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label htmlFor="email" className="text-purple-200">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@acme.com"
                        value={leadInfo.email}
                        onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                        className="bg-white/10 border-purple-400/50 text-white placeholder:text-purple-300/50 focus:border-purple-400"
                        data-testid="input-email"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label htmlFor="phone" className="text-purple-200">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={leadInfo.phone}
                        onChange={(e) => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                        className="bg-white/10 border-purple-400/50 text-white placeholder:text-purple-300/50 focus:border-purple-400"
                        data-testid="input-phone"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-6 text-lg rounded-xl shadow-lg transform hover:scale-[1.02] transition-transform"
                        disabled={generateQuestionsMutation.isPending}
                        data-testid="btn-start-game"
                      >
                        {generateQuestionsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Preparing Your Challenge...
                          </>
                        ) : (
                          <>
                            <Rocket className="mr-2 h-5 w-5" />
                            Start the Challenge!
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {phase === "loading-questions" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <Card className="bg-white/10 backdrop-blur-lg border-purple-500/30 shadow-2xl p-12">
                <motion.div 
                  className="mx-auto mb-6 w-24 h-28"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {thinkingOwl}
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Preparing Your Challenge...</h2>
                <p className="text-purple-200">Generating 10 questions about {leadInfo.company}'s products & services</p>
                <div className="flex justify-center gap-2 mt-6">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full bg-purple-500"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {phase === "playing" && questions.length > 0 && (
            <motion.div
              key={`playing-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-purple-500/30 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600/50 to-pink-600/50 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-200" />
                    <span className="text-purple-200 font-medium" data-testid="text-question-counter">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(questions.length)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < currentQuestionIndex
                            ? "bg-purple-400"
                            : i === currentQuestionIndex
                            ? "bg-white"
                            : "bg-white/30"
                        }`}
                        initial={i === currentQuestionIndex ? { scale: 0 } : {}}
                        animate={i === currentQuestionIndex ? { scale: 1 } : {}}
                        transition={{ type: "spring", stiffness: 500 }}
                      />
                    ))}
                  </div>
                </div>

                <div className="w-full bg-purple-900/50 h-2">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2"
                    initial={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                    animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <CardContent className="p-6">
                  <div className="flex gap-4 mb-8">
                    <motion.div 
                      className="flex-shrink-0 w-16 h-20"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {thinkingOwl}
                    </motion.div>
                    <div className="flex-1">
                      <div className="relative bg-white/20 rounded-2xl rounded-tl-none p-5 shadow-lg">
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-white/20 transform rotate-45" />
                        <p className="text-white text-lg font-medium relative z-10" data-testid="text-question">
                          {questions[currentQuestionIndex].question}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {questions[currentQuestionIndex].options.map((option, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isTransitioning}
                        className={`w-full p-4 rounded-xl text-left transition-all transform ${
                          selectedOption === idx
                            ? "bg-purple-500/40 border-2 border-purple-400 scale-[1.02]"
                            : "bg-white/10 border-2 border-transparent hover:bg-white/20 hover:border-purple-400/50"
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={!isTransitioning ? { scale: 1.02 } : {}}
                        whileTap={!isTransitioning ? { scale: 0.98 } : {}}
                        data-testid={`btn-option-${idx}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            selectedOption === idx
                              ? "bg-purple-500 text-white"
                              : "bg-purple-500/50 text-white"
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-white font-medium flex-1">{option}</span>
                          {selectedOption === idx && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <CheckCircle className="w-6 h-6 text-purple-400" />
                            </motion.span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {phase === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <Confetti />
              <Card className="bg-white/10 backdrop-blur-lg border-purple-500/30 shadow-2xl relative overflow-hidden">
                <CardHeader className="text-center relative pb-2">
                  <motion.div 
                    className="mx-auto mb-4 w-24 h-28"
                    animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {celebrationOwl}
                  </motion.div>
                  
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                    className="flex justify-center gap-1 mb-4"
                  >
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            i < score ? "text-yellow-400 fill-yellow-400" : "text-gray-500"
                          }`}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  <CardTitle className="text-3xl font-bold text-white" data-testid="text-final-score">
                    {getScoreMessage().title}
                  </CardTitle>
                  <motion.p
                    className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  >
                    {score} / {questions.length}
                  </motion.p>
                  <CardDescription className="text-lg text-purple-200 mt-4">
                    {getScoreMessage().message}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => setShowCertificate(true)}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold"
                      data-testid="btn-view-certificate"
                    >
                      <Award className="mr-2 h-5 w-5" />
                      View Certificate
                    </Button>
                    <Button
                      onClick={handleShareLinkedIn}
                      className="bg-[#0077B5] hover:bg-[#006699] text-white font-bold"
                      data-testid="btn-share-linkedin"
                    >
                      <SiLinkedin className="mr-2 h-5 w-5" />
                      Share on LinkedIn
                    </Button>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 max-h-48 overflow-y-auto">
                    <h3 className="text-purple-200 font-medium mb-3 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      Your Answers:
                    </h3>
                    {answers.map((answer, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 mb-2 p-2 rounded-lg bg-white/5"
                      >
                        {answer.selectedIndex === answer.correctIndex ? (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs flex-shrink-0">✗</span>
                        )}
                        <span className="text-white/80 text-sm truncate">Q{idx + 1}: {questions[idx]?.question}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={handleBookDemo}
                      disabled={submitLeadMutation.isPending || submitLeadMutation.isSuccess}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-6 text-lg rounded-xl shadow-lg transform hover:scale-[1.02] transition-transform"
                      data-testid="btn-book-demo"
                    >
                      {submitLeadMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : submitLeadMutation.isSuccess ? (
                        <>
                          <PartyPopper className="mr-2 h-5 w-5" />
                          Demo Request Sent!
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Book Your Free Demo
                        </>
                      )}
                    </Button>
                  </motion.div>

                  <p className="text-center text-purple-300/70 text-sm">
                    Our team will reach out to schedule your personalized demo.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-purple-300/50 text-sm">
            Powered by <span className="font-semibold text-purple-300">Rev Winner</span> — Built by Sales Professionals, For Sales Professionals
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCertificate(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              <div ref={certificateRef}>
                <Certificate
                  name={leadInfo.name}
                  score={score}
                  totalQuestions={questions.length}
                  company={leadInfo.company}
                />
              </div>
              
              <div className="flex gap-3 justify-center mt-6">
                <Button
                  onClick={handleDownloadCertificate}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold"
                  data-testid="btn-download-certificate"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Certificate
                </Button>
                <Button
                  onClick={handleShareLinkedIn}
                  className="bg-[#0077B5] hover:bg-[#006699] text-white font-bold"
                >
                  <SiLinkedin className="mr-2 h-5 w-5" />
                  Share on LinkedIn
                </Button>
                <Button
                  onClick={() => setShowCertificate(false)}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
