import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, Check } from 'lucide-react';
import { MatchingItem } from '@/lib/schemas';
import confetti from 'canvas-confetti';

type MatchingProps = {
  matchingItems: MatchingItem[];
  clearPDF: () => void;
  title: string;
};

export default function Matching({
  matchingItems,
  clearPDF,
  title = 'Matching Game',
}: MatchingProps) {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<string | null>(
    null
  );
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [shuffledTerms, setShuffledTerms] = useState<MatchingItem[]>([]);
  const [shuffledDefinitions, setShuffledDefinitions] = useState<
    MatchingItem[]
  >([]);
  const [isComplete, setIsComplete] = useState(false);

  // Shuffle the terms and definitions
  useEffect(() => {
    const shuffleArray = (array: MatchingItem[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    setShuffledTerms(shuffleArray(matchingItems));
    setShuffledDefinitions(shuffleArray(matchingItems));
  }, [matchingItems]);

  // Check if the game is complete
  useEffect(() => {
    if (
      matchedPairs.length === matchingItems.length &&
      matchingItems.length > 0
    ) {
      setIsComplete(true);
      // Trigger confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [matchedPairs, matchingItems]);

  const handleTermClick = (id: string) => {
    if (matchedPairs.includes(id)) return;
    setSelectedTerm(id);
  };

  const handleDefinitionClick = (id: string) => {
    if (matchedPairs.includes(id)) return;
    setSelectedDefinition(id);
  };

  // Check for matches
  useEffect(() => {
    if (selectedTerm && selectedDefinition) {
      if (selectedTerm === selectedDefinition) {
        // Match found
        setMatchedPairs([...matchedPairs, selectedTerm]);
        // Reset selections
        setSelectedTerm(null);
        setSelectedDefinition(null);
      } else {
        // No match, reset after a delay
        const timer = setTimeout(() => {
          setSelectedTerm(null);
          setSelectedDefinition(null);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedTerm, selectedDefinition, matchedPairs]);

  const handleReset = () => {
    setSelectedTerm(null);
    setSelectedDefinition(null);
    setMatchedPairs([]);
    setIsComplete(false);

    // Reshuffle
    const shuffleArray = (array: MatchingItem[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    setShuffledTerms(shuffleArray(matchingItems));
    setShuffledDefinitions(shuffleArray(matchingItems));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
          {title}
        </h1>

        {isComplete ? (
          <div className="text-center space-y-8">
            <div className="bg-green-100 dark:bg-green-900/30 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-4">
                Congratulations!
              </h2>
              <p className="text-green-600 dark:text-green-400">
                You&apos;ve successfully matched all the pairs!
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleReset}
                variant="outline"
                className="bg-muted hover:bg-muted/80"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Play Again
              </Button>
              <Button
                onClick={clearPDF}
                className="bg-primary hover:bg-primary/90"
              >
                <FileText className="mr-2 h-4 w-4" /> Try Another PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Terms</h2>
                <div className="space-y-2">
                  {shuffledTerms.map((item) => (
                    <div
                      key={`term-${item.id}`}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        matchedPairs.includes(item.id)
                          ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                          : selectedTerm === item.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                          : 'bg-card border border-border hover:bg-accent'
                      }`}
                      onClick={() => handleTermClick(item.id)}
                    >
                      <div className="flex justify-between items-center">
                        <span>{item.term}</span>
                        {matchedPairs.includes(item.id) && (
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Definitions</h2>
                <div className="space-y-2">
                  {shuffledDefinitions.map((item) => (
                    <div
                      key={`def-${item.id}`}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        matchedPairs.includes(item.id)
                          ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                          : selectedDefinition === item.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                          : 'bg-card border border-border hover:bg-accent'
                      }`}
                      onClick={() => handleDefinitionClick(item.id)}
                    >
                      <div className="flex justify-between items-center">
                        <span>{item.definition}</span>
                        {matchedPairs.includes(item.id) && (
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleReset}
                variant="outline"
                className="bg-muted hover:bg-muted/80"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
