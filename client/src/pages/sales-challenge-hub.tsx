import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, DoorOpen, Trophy, Target, Sparkles, ArrowLeft, Star } from "lucide-react";
import { Link } from "wouter";
import revWinnerLogoUrl from "@assets/rev-winner-logo.png";

type GameSelection = "hub" | "knowledge" | "doors";

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  onClick: () => void;
  gradient: string;
  badge?: string;
}

function GameCard({ title, description, icon, features, onClick, gradient, badge }: GameCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className={`relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br ${gradient} h-full`}>
        {badge && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" />
            {badge}
          </div>
        )}
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{title}</h3>
              <p className="text-white/70 text-sm">{description}</p>
            </div>
          </div>
          
          <ul className="space-y-3 mb-6">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-white/90">
                <div className="w-2 h-2 rounded-full bg-purple-300" />
                {feature}
              </li>
            ))}
          </ul>
          
          <Button 
            className="w-full bg-white text-purple-700 hover:bg-white/90 font-semibold"
            size="lg"
            data-testid={`play-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            Play Now
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SalesChallengeHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-white/70 hover:text-white" data-testid="back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <img src={revWinnerLogoUrl} alt="Rev Winner" className="h-10" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Sales Challenge
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Test your sales knowledge and skills with our interactive games. 
            Choose your challenge and prove you're a sales champion!
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/sales-challenge/knowledge">
              <GameCard
                title="Sales Knowledge Quiz"
                description="10 company-specific questions"
                icon={<Brain className="w-8 h-8 text-white" />}
                features={[
                  "AI-generated company questions",
                  "Test your sales expertise",
                  "Earn a professional certificate",
                  "Share your achievement on LinkedIn"
                ]}
                onClick={() => {}}
                gradient="from-purple-600 to-indigo-700"
              />
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/sales-challenge/doors">
              <GameCard
                title="Open the Doors"
                description="10 doors to sales success"
                icon={<DoorOpen className="w-8 h-8 text-white" />}
                features={[
                  "Animated owl sales character",
                  "Customer interaction simulation",
                  "Progressive door challenges",
                  "Win a golden trophy!"
                ]}
                onClick={() => {}}
                gradient="from-fuchsia-600 to-purple-700"
                badge="NEW"
              />
            </Link>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="flex items-center justify-center gap-8 text-white/60 flex-wrap">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>Earn Certificates</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              <span>Test Your Skills</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Have Fun Learning</span>
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/50 text-sm mb-2">Questions about Rev Winner?</p>
            <div className="flex items-center justify-center gap-6 text-white/70 text-sm flex-wrap">
              <a href="tel:+18326328555" className="hover:text-purple-400 transition-colors">
                🇺🇸 +1 (832) 632-8555
              </a>
              <a href="tel:+918130276382" className="hover:text-purple-400 transition-colors">
                🇮🇳 +91 8130276382
              </a>
              <a href="mailto:sales@revwinner.com" className="hover:text-purple-400 transition-colors">
                sales@revwinner.com
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
