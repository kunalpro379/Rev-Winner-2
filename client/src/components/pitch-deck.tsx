import { SlideCarousel } from "./slide-carousel";
import { AlertCircle } from "lucide-react";

interface PitchSlide {
  title: string;
  content: string[];
  highlight?: string;
}

interface PitchDeckProps {
  slides: PitchSlide[];
}

export function PitchDeck({ slides }: PitchDeckProps) {
  if (!slides || slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 dark:text-amber-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Unable to Generate Pitch Deck
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          The AI response was incomplete. Please try again or switch to a different AI provider in Settings.
        </p>
      </div>
    );
  }

  const slideComponents = slides.map((slide, index) => (
    <div key={index} className="flex flex-col h-full justify-center space-y-6">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent text-center">
        {slide.title}
      </h2>
      
      {slide.highlight && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-4 border-l-4 border-purple-600">
          <p className="text-lg font-semibold text-center text-purple-900 dark:text-purple-100">
            {slide.highlight}
          </p>
        </div>
      )}
      
      <div className="space-y-4">
        {slide.content.map((point, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
              {idx + 1}
            </div>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
              {point}
            </p>
          </div>
        ))}
      </div>
    </div>
  ));

  return <SlideCarousel slides={slideComponents} slideType="Slide" />;
}
