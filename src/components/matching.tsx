import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check } from 'lucide-react';
import { MatchingItem } from '@/lib/schemas';
import confetti from 'canvas-confetti';
import { debugLog } from '@/lib/utils';

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
  const [selectedTermItem, setSelectedTermItem] = useState<MatchingItem | null>(
    null
  );
  const [selectedDefItem, setSelectedDefItem] = useState<MatchingItem | null>(
    null
  );
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [shuffledTerms, setShuffledTerms] = useState<MatchingItem[]>([]);
  const [shuffledDefinitions, setShuffledDefinitions] = useState<
    MatchingItem[]
  >([]);
  const [isComplete, setIsComplete] = useState(false);
  const [wrongSelection, setWrongSelection] = useState(false);

  // For debugging
  useEffect(() => {
    console.log('Matching items received:', matchingItems);
  }, [matchingItems]);

  // Shuffle the terms and definitions
  useEffect(() => {
    if (matchingItems.length === 0) return;

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

    // Reset state when new items are received
    setSelectedTermItem(null);
    setSelectedDefItem(null);
    setMatchedPairs([]);
    setIsComplete(false);
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

  const handleTermClick = (item: MatchingItem) => {
    if (matchedPairs.includes(item.id)) return;
    setSelectedTermItem(item);
  };

  const handleDefinitionClick = (item: MatchingItem) => {
    if (matchedPairs.includes(item.id)) return;
    setSelectedDefItem(item);
  };

  // Check for matches
  useEffect(() => {
    if (selectedTermItem && selectedDefItem) {
      console.log('Checking match between:', selectedTermItem, selectedDefItem);

      // Check if the IDs match (same item)
      if (selectedTermItem.id === selectedDefItem.id) {
        console.log('Match found!');
        // Match found
        setMatchedPairs((prev) => [...prev, selectedTermItem.id]);
        // Reset selections
        setSelectedTermItem(null);
        setSelectedDefItem(null);
      } else {
        console.log('No match found');
        // No match, show wrong selection animation
        setWrongSelection(true);

        // Reset after a delay
        const timer = setTimeout(() => {
          setWrongSelection(false);
          setSelectedTermItem(null);
          setSelectedDefItem(null);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedTermItem, selectedDefItem]);

  const handleReset = () => {
    setSelectedTermItem(null);
    setSelectedDefItem(null);
    setMatchedPairs([]);
    setIsComplete(false);
    setWrongSelection(false);

    // Reshuffle
    if (matchingItems.length === 0) return;

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

  if (matchingItems.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>
          No matching items available. Please wait while we generate them...
        </p>
      </div>
    );
  }

  // Animation variants for wrong selection
  const wrongAnimationVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="p-8">
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
          <div className="flex justify-center">
            <Button
              onClick={handleReset}
              variant="outline"
              className="bg-muted hover:bg-muted/80"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Play Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Terms</h2>
              <div className="grid grid-cols-1 gap-2">
                {shuffledTerms.map((item) => (
                  <motion.div
                    key={`term-${item.id}`}
                    animate={
                      wrongSelection && selectedTermItem?.id === item.id
                        ? 'animate'
                        : ''
                    }
                    variants={wrongAnimationVariants}
                    className={`p-4 rounded-lg cursor-pointer transition-colors min-h-[80px] flex items-center ${
                      matchedPairs.includes(item.id)
                        ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                        : selectedTermItem?.id === item.id && wrongSelection
                        ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                        : selectedTermItem?.id === item.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                        : 'bg-card border border-border hover:bg-accent'
                    }`}
                    onClick={() => handleTermClick(item)}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span>{item.term}</span>
                      {matchedPairs.includes(item.id) && (
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Definitions</h2>
              <div className="grid grid-cols-1 gap-2">
                {shuffledDefinitions.map((item) => (
                  <motion.div
                    key={`def-${item.id}`}
                    animate={
                      wrongSelection && selectedDefItem?.id === item.id
                        ? 'animate'
                        : ''
                    }
                    variants={wrongAnimationVariants}
                    className={`p-4 rounded-lg cursor-pointer transition-colors min-h-[80px] flex items-center ${
                      matchedPairs.includes(item.id)
                        ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                        : selectedDefItem?.id === item.id && wrongSelection
                        ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                        : selectedDefItem?.id === item.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                        : 'bg-card border border-border hover:bg-accent'
                    }`}
                    onClick={() => handleDefinitionClick(item)}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span>{item.definition}</span>
                      {matchedPairs.includes(item.id) && (
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </motion.div>
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
    </div>
  );
}
