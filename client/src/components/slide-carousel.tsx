import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SlideCarouselProps {
  slides: React.ReactNode[];
  slideType?: string;
}

export function SlideCarousel({ slides, slideType = "Slide" }: SlideCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="space-y-4">
      {/* Slide Navigation */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
          {slideType} {currentSlide + 1} of {slides.length}
        </Badge>
        <div className="flex gap-2">
          <Button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            variant="outline"
            size="sm"
            data-testid="button-prev-slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            variant="outline"
            size="sm"
            data-testid="button-next-slide"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="relative min-h-[400px] bg-white dark:bg-slate-900 rounded-lg border-2 border-purple-200 dark:border-purple-800 p-8 shadow-lg">
        {slides[currentSlide]}
      </div>

      {/* Slide Indicators */}
      <div className="flex items-center justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? "w-8 bg-purple-600 dark:bg-purple-400"
                : "w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
            }`}
            data-testid={`slide-indicator-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
