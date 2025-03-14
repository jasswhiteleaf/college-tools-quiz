import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, RefreshCw, RotateCw } from 'lucide-react';
import { Flashcard } from '@/lib/schemas';

type FlashcardsProps = {
  flashcards: Flashcard[];
  clearPDF: () => void;
  title: string;
};

export default function Flashcards({
  flashcards,
  clearPDF,
  title = 'Flashcards',
}: FlashcardsProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState(0);

  // Log flashcards data for debugging
  useEffect(() => {
    console.log('Flashcards component received:', flashcards);
  }, [flashcards]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress((currentCardIndex / flashcards.length) * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentCardIndex, flashcards.length]);

  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    // setIsFlipped(!isFlipped);
    setCurrentCardIndex(0);
    setProgress(0);
  };

  const handleReset = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setProgress(0);
  };

  // Check if we have valid flashcards
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>No flashcards available. Please wait while we generate them...</p>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  // Check if current card is valid
  if (!currentCard || !currentCard.front || !currentCard.back) {
    console.error('Invalid flashcard at index', currentCardIndex, currentCard);
    return (
      <div className="p-8 text-center">
        <p>Error loading flashcard. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="relative">
        <Progress value={progress} className="h-1 mb-8" />
        <div className="min-h-[400px] flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCardIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg"
            >
              <div className="perspective-1000 w-full">
                <div
                  className={`relative w-full h-96 cursor-pointer transition-transform duration-500 transform-style-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                  onClick={handleFlip}
                >
                  <div
                    className={`absolute w-full h-full backface-hidden bg-card border border-zinc-200 border-border rounded-lg p-6 flex flex-col justify-center items-center shadow-md ${
                      isFlipped ? 'hidden' : ''
                    }`}
                  >
                    <h2 className="text-xl font-semibold text-center">
                      {currentCard.front}
                    </h2>
                    <div className="absolute bottom-4 right-4 text-muted-foreground">
                      <RotateCw size={16} />
                    </div>
                  </div>
                  <div
                    className={`absolute w-full h-full backface-hidden bg-primary text-primary-foreground border border-primary rounded-lg p-6 flex flex-col justify-center items-center shadow-md rotate-y-180 ${
                      !isFlipped ? 'hidden' : ''
                    }`}
                  >
                    <p className="text-lg text-center">{currentCard.back}</p>
                    <div className="absolute bottom-4 right-4">
                      <RotateCw size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-between items-center pt-8">
          <Button
            onClick={handlePreviousCard}
            disabled={currentCardIndex === 0}
            variant="ghost"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <span className="text-sm font-medium">
            {currentCardIndex + 1} / {flashcards.length}
          </span>
          <Button
            onClick={handleNextCard}
            disabled={currentCardIndex === flashcards.length - 1}
            variant="ghost"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center pt-8">
          <Button
            onClick={handleReset}
            variant="outline"
            className="bg-muted hover:bg-muted/80"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
