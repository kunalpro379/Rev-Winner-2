import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, ArrowLeft, Download, Calendar, Star, DoorOpen, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { Link } from "wouter";
import revWinnerLogoUrl from "@assets/rev-winner-logo.png";

interface LeadInfo {
  name: string;
  company: string;
  email: string;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

type GamePhase = "lead-capture" | "loading" | "playing" | "won" | "lost";

const ProfessionalOwl = ({ mood }: { mood: "neutral" | "happy" | "sad" }) => (
  <motion.div
    animate={mood === "happy" ? { y: [0, -10, 0], rotate: [0, 5, -5, 0] } : mood === "sad" ? { y: [0, 5, 0] } : {}}
    transition={{ duration: 0.5, repeat: mood === "happy" ? 2 : 0 }}
    className="relative"
  >
    <svg viewBox="0 0 200 280" className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="owlFur" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="tieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      <ellipse cx="100" cy="210" rx="60" ry="70" fill="url(#suitGrad)" />
      <path d="M40 180 L100 220 L160 180 L160 280 L40 280 Z" fill="url(#suitGrad)" />
      <rect x="85" y="165" width="30" height="60" fill="white" />
      <path d="M100 165 L85 185 L100 280 L115 185 Z" fill="url(#tieGrad)" />
      <ellipse cx="100" cy="120" rx="55" ry="60" fill="url(#owlFur)" />
      <ellipse cx="100" cy="135" rx="35" ry="40" fill="#C4B5FD" />
      <circle cx="75" cy="105" r="22" fill="white" />
      <circle cx="125" cy="105" r="22" fill="white" />
      <motion.g animate={mood === "happy" ? { scaleY: [1, 0.1, 1] } : {}}>
        <circle cx="77" cy="107" r="12" fill="#1F2937" />
        <circle cx="123" cy="107" r="12" fill="#1F2937" />
        <circle cx="80" cy="103" r="5" fill="white" />
        <circle cx="126" cy="103" r="5" fill="white" />
      </motion.g>
      <path d="M93 125 L100 140 L107 125" fill="#F59E0B" stroke="#F59E0B" strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 80 Q45 50 70 75" fill="url(#owlFur)" />
      <path d="M150 80 Q155 50 130 75" fill="url(#owlFur)" />
      {mood === "happy" && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <path d="M65 130 Q75 138 85 130" stroke="#6366F1" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M115 130 Q125 138 135 130" stroke="#6366F1" strokeWidth="3" fill="none" strokeLinecap="round" />
        </motion.g>
      )}
      {mood === "sad" && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <path d="M65 135 Q75 128 85 135" stroke="#6366F1" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M115 135 Q125 128 135 135" stroke="#6366F1" strokeWidth="3" fill="none" strokeLinecap="round" />
        </motion.g>
      )}
    </svg>
  </motion.div>
);

const Door = ({ number, isOpen, isActive }: { number: number; isOpen: boolean; isActive: boolean }) => (
  <motion.div
    className={`relative w-16 h-24 md:w-20 md:h-28 ${isActive ? 'scale-110 z-10' : 'opacity-60'}`}
    animate={isActive ? { scale: [1, 1.05, 1] } : {}}
    transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
  >
    <div className={`absolute inset-0 rounded-t-lg ${isOpen ? 'bg-green-500' : isActive ? 'bg-purple-600' : 'bg-slate-600'} shadow-lg`}>
      <div className="absolute inset-2 rounded-t-md bg-gradient-to-b from-amber-700 to-amber-900 flex items-center justify-center">
        {isOpen ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-green-400 font-bold text-xl"
          >
            ✓
          </motion.div>
        ) : (
          <span className="text-amber-200 font-bold text-lg">{number}</span>
        )}
      </div>
      {!isOpen && (
        <div className="absolute right-3 top-1/2 w-2 h-2 rounded-full bg-yellow-400 shadow-lg" />
      )}
    </div>
  </motion.div>
);

const CustomerAvatar = ({ question }: { question: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start gap-4 bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white/20"
  >
    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
      <User className="w-6 h-6 md:w-8 md:h-8 text-white" />
    </div>
    <div className="flex-1">
      <p className="text-xs text-blue-300 mb-1">Customer asks:</p>
      <p className="text-white text-sm md:text-lg font-medium">{question}</p>
    </div>
  </motion.div>
);

const Confetti = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
    {[...Array(50)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-3 h-3 rounded-sm"
        style={{
          left: `${Math.random() * 100}%`,
          backgroundColor: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][i % 5],
        }}
        initial={{ y: -20, opacity: 1, rotate: 0 }}
        animate={{
          y: window.innerHeight + 100,
          opacity: [1, 1, 0],
          rotate: Math.random() * 720,
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          delay: Math.random() * 1,
          repeat: Infinity,
          repeatDelay: Math.random() * 3,
        }}
      />
    ))}
  </div>
);

const Certificate = ({ name, company, score }: { name: string; company: string; score: number }) => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return (
    <div 
      style={{ 
        width: '700px', 
        height: '500px',
        background: '#ffffff',
        padding: '0',
        border: '2px solid #e5e7eb',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Georgia, serif'
      }}
    >
      <div style={{ position: 'absolute', top: '12px', left: '12px', width: '60px', height: '60px', borderTop: '4px solid #7c3aed', borderLeft: '4px solid #7c3aed' }} />
      <div style={{ position: 'absolute', top: '12px', right: '12px', width: '60px', height: '60px', borderTop: '4px solid #7c3aed', borderRight: '4px solid #7c3aed' }} />
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '60px', height: '60px', borderBottom: '4px solid #7c3aed', borderLeft: '4px solid #7c3aed' }} />
      <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '60px', height: '60px', borderBottom: '4px solid #7c3aed', borderRight: '4px solid #7c3aed' }} />
      
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', padding: '40px 50px' }}>
        <img 
          src={revWinnerLogoUrl} 
          alt="Rev Winner" 
          style={{ height: '50px', marginBottom: '16px', objectFit: 'contain' }}
          crossOrigin="anonymous"
        />
        
        <h2 style={{ fontSize: '28px', fontWeight: '400', color: '#7c3aed', marginBottom: '16px', fontFamily: 'Georgia, serif' }}>Certificate of Achievement</h2>
        
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px', fontFamily: 'Arial, sans-serif' }}>This certificate acknowledges that</p>
        
        <div style={{ border: '2px solid #7c3aed', padding: '12px 40px', marginBottom: '8px', background: '#faf5ff' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1f2937', margin: 0, fontFamily: 'Georgia, serif' }}>{name}</h1>
        </div>
        
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '12px', fontFamily: 'Arial, sans-serif' }}>
          from <span style={{ fontWeight: 600, color: '#374151' }}>{company}</span>
        </p>
        
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px', fontFamily: 'Arial, sans-serif' }}>has successfully completed</p>
        
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '16px', fontFamily: 'Georgia, serif' }}>Open the Doors of Opportunities</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontFamily: 'Arial, sans-serif' }}>Date of Completion</p>
            <p style={{ fontSize: '14px', color: '#374151', fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>{today}</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontFamily: 'Arial, sans-serif' }}>Final Score</p>
            <p style={{ fontSize: '14px', color: '#374151', fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>{score} / 100</p>
          </div>
          
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
          }}>
            <Trophy style={{ width: '24px', height: '24px' }} />
            <span style={{ fontSize: '8px', marginTop: '2px' }}>WINNER</span>
          </div>
        </div>
        
        <div style={{ marginTop: 'auto', width: '100%', borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>Achievement</p>
            <p style={{ fontSize: '14px', color: '#7c3aed', fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>Sales Champion</p>
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[...Array(10)].map((_, i) => (
              <Star key={i} style={{ width: '14px', height: '14px', color: '#eab308', fill: '#eab308' }} />
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

export default function DoorsGame() {
  const { toast } = useToast();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<GamePhase>("lead-capture");
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({ name: "", company: "", email: "" });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [openedDoors, setOpenedDoors] = useState<number[]>([]);
  const [owlMood, setOwlMood] = useState<"neutral" | "happy" | "sad">("neutral");
  const [isAnswering, setIsAnswering] = useState(false);

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
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setPhase("lead-capture");
    },
  });

  const submitLeadMutation = useMutation({
    mutationFn: async (data: LeadInfo & { score: number; totalQuestions: number }) => {
      const res = await apiRequest("POST", "/api/game/doors-lead", data);
      return res.json();
    },
  });

  const requestDemoMutation = useMutation({
    mutationFn: async (data: LeadInfo & { score: number; totalQuestions: number }) => {
      const res = await apiRequest("POST", "/api/game/request-demo", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Your demo request has been submitted. We'll be in touch soon!" });
    },
  });

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadInfo.name || !leadInfo.company || !leadInfo.email) {
      toast({ title: "Missing Information", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setPhase("loading");
    submitLeadMutation.mutate({ ...leadInfo, score: 0, totalQuestions: 10 });
    generateQuestionsMutation.mutate(leadInfo.company);
  };

  const handleAnswer = (optionIndex: number) => {
    if (isAnswering) return;
    setIsAnswering(true);

    const question = questions[currentQuestion];
    const isCorrect = optionIndex === question.correctIndex;

    if (isCorrect) {
      setOwlMood("happy");
      setScore(prev => prev + 10);
      setOpenedDoors(prev => [...prev, currentQuestion + 1]);

      setTimeout(() => {
        setOwlMood("neutral");
        if (currentQuestion < 9) {
          setCurrentQuestion(prev => prev + 1);
        } else {
          setPhase("won");
        }
        setIsAnswering(false);
      }, 1500);
    } else {
      setOwlMood("sad");
      setTimeout(() => {
        setPhase("lost");
        setIsAnswering(false);
      }, 1500);
    }
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
      
      const filename = `RevWinner-DoorsChampion-${leadInfo.name.replace(/\s+/g, '-')}.png`;
      
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
                title: 'Rev Winner Certificate',
                text: 'My Open the Doors of Opportunities Certificate!',
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
        
        toast({ title: "Certificate Downloaded!", description: "Your achievement certificate has been saved." });
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Certificate download error:', error);
      toast({ title: "Download Failed", description: "Could not download the certificate.", variant: "destructive" });
    }
  };

  const handleBookDemo = () => {
    requestDemoMutation.mutate({ ...leadInfo, score, totalQuestions: 10 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/sales-challenge">
            <Button variant="ghost" className="text-white/70 hover:text-white" data-testid="back-to-hub">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          </Link>
          <img src={revWinnerLogoUrl} alt="Rev Winner" className="h-8" />
        </div>

        <AnimatePresence mode="wait">
          {phase === "lead-capture" && (
            <motion.div
              key="lead-capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              <Card className="bg-white/10 backdrop-blur-lg border-purple-500/30">
                <CardHeader className="text-center">
                  <div className="w-32 h-40 mx-auto mb-4">
                    <ProfessionalOwl mood="neutral" />
                  </div>
                  <CardTitle className="text-2xl text-white">Open the Doors of Opportunities</CardTitle>
                  <p className="text-purple-200">Answer 10 questions to open all doors and win!</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleStartGame} className="space-y-4">
                    <div>
                      <Label className="text-white">Full Name</Label>
                      <Input
                        value={leadInfo.name}
                        onChange={(e) => setLeadInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Smith"
                        className="bg-white/10 border-purple-500/30 text-white"
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Company Name</Label>
                      <Input
                        value={leadInfo.company}
                        onChange={(e) => setLeadInfo(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Your Company"
                        className="bg-white/10 border-purple-500/30 text-white"
                        data-testid="input-company"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Email Address</Label>
                      <Input
                        type="email"
                        value={leadInfo.email}
                        onChange={(e) => setLeadInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@company.com"
                        className="bg-white/10 border-purple-500/30 text-white"
                        data-testid="input-email"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600" size="lg" data-testid="start-game">
                      <DoorOpen className="w-5 h-5 mr-2" />
                      Start the Challenge
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <Loader2 className="w-16 h-16 text-purple-400 animate-spin mb-4" />
              <p className="text-white text-xl">Preparing your challenges...</p>
            </motion.div>
          )}

          {phase === "playing" && questions[currentQuestion] && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-bold">{score} points</span>
                </div>
                <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                  <span className="text-white">Question {currentQuestion + 1}/10</span>
                </div>
              </div>

              <div className="flex justify-center gap-2 mb-6 flex-wrap">
                {[...Array(10)].map((_, i) => (
                  <Door key={i} number={i + 1} isOpen={openedDoors.includes(i + 1)} isActive={i === currentQuestion} />
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="hidden md:flex justify-center">
                  <div className="w-48 h-64">
                    <ProfessionalOwl mood={owlMood} />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <CustomerAvatar question={questions[currentQuestion].question} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {questions[currentQuestion].options.map((option, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(i)}
                        disabled={isAnswering}
                        className="p-4 bg-white/10 backdrop-blur border border-purple-500/30 rounded-xl text-left text-white hover:bg-purple-600/30 transition-all disabled:opacity-50"
                        data-testid={`option-${i}`}
                      >
                        <span className="font-bold text-purple-300 mr-2">{String.fromCharCode(65 + i)}.</span>
                        {option}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {phase === "won" && (
            <motion.div
              key="won"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <Confetti />
              <div className="w-48 h-64 mx-auto mb-6">
                <ProfessionalOwl mood="happy" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="mb-6"
              >
                <Trophy className="w-24 h-24 text-yellow-400 mx-auto drop-shadow-lg" />
              </motion.div>
              <h1 className="text-4xl font-bold text-white mb-2">Congratulations!</h1>
              <p className="text-xl text-purple-200 mb-2">You've opened all 10 doors!</p>
              <p className="text-3xl font-bold text-yellow-400 mb-8">Final Score: {score}/100</p>

              <div className="flex flex-col items-center gap-4 mb-8">
                <div ref={certificateRef} className="hidden">
                  <Certificate name={leadInfo.name} company={leadInfo.company} score={score} />
                </div>
                <div className="overflow-x-auto max-w-full">
                  <Certificate name={leadInfo.name} company={leadInfo.company} score={score} />
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <Button onClick={handleDownloadCertificate} className="bg-green-600 hover:bg-green-700" size="lg" data-testid="download-certificate">
                  <Download className="w-5 h-5 mr-2" />
                  Download Certificate
                </Button>
                <Button onClick={handleBookDemo} className="bg-gradient-to-r from-purple-600 to-fuchsia-600" size="lg" disabled={requestDemoMutation.isPending} data-testid="book-demo">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Rev Winner Demo
                </Button>
                <Link href="/">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" size="lg" data-testid="go-home">
                    Visit Rev Winner
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {phase === "lost" && (
            <motion.div
              key="lost"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center max-w-lg mx-auto"
            >
              <div className="w-48 h-64 mx-auto mb-6">
                <ProfessionalOwl mood="sad" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">No worries!</h1>
              <p className="text-xl text-purple-200 mb-2">Sales is always a learning process.</p>
              <p className="text-lg text-white/70 mb-4">You opened {openedDoors.length} door{openedDoors.length !== 1 ? 's' : ''} and scored {score} points.</p>
              
              <Card className="bg-white/10 backdrop-blur border-purple-500/30 mb-6">
                <CardContent className="p-6">
                  <p className="text-white mb-4">
                    Want to master sales conversations and close more deals? 
                    Rev Winner can help you become a sales champion!
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button onClick={handleBookDemo} className="bg-gradient-to-r from-purple-600 to-fuchsia-600" size="lg" disabled={requestDemoMutation.isPending} data-testid="book-demo-lost">
                      <Calendar className="w-5 h-5 mr-2" />
                      Book Rev Winner Demo
                    </Button>
                    <Link href="/">
                      <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" size="lg" data-testid="go-home-lost">
                        Visit Rev Winner
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Link href="/sales-challenge">
                <Button variant="ghost" className="text-purple-300 hover:text-white" data-testid="try-again">
                  Try Another Game
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
