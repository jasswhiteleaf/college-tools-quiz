'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  questionsSchema,
  flashcardsSchema,
  matchingItemsSchema,
  LearningMode,
} from '@/lib/schemas';
import { z } from 'zod';
import { toast } from 'sonner';
import { FileUp, Plus, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Quiz from '@/components/quiz';
import Flashcards from '@/components/flashcards';
import Matching from '@/components/matching';
import TabsNavigation from '@/components/tabs-navigation';
import { Link } from '@/components/ui/link';
import { generateQuizTitle } from './actions';
import { AnimatePresence, motion } from 'framer-motion';
import { debugLog } from '@/lib/utils';
import {
  useQuizGeneration,
  useFlashcardsGeneration,
} from './hooks/useLearningGeneration';
import { useMatchingGeneration } from './hooks/useMatchingGeneration';
import {
  encodeFileAsBase64,
  isValidPdfFile,
  isSafariBrowser,
} from './utils/fileUtils';
import { useLearningToolState } from './hooks/useLearningToolState';

/**
 * LearningTool Component
 *
 * This component provides a user interface for uploading PDFs and generating
 * learning materials (quizzes, flashcards, and matching games) using AI.
 *
 * The component uses a reducer pattern for state management, with the reducer logic
 * extracted to a separate file for better maintainability.
 */
export default function LearningTool() {
  // Use the custom hook for state management
  const { state, dispatch } = useLearningToolState();

  // Extract state variables for easier access
  const {
    files,
    title,
    questions,
    flashcards,
    matchingItems,
    learningMode,
    processingStep,
    pdfUploaded,
    isProcessingAll,
    useOpenAI,
    isDragging,
  } = state;

  // Keep a reference for processed matching items
  const processedItemsRef = useRef<Set<string>>(new Set());

  // Track completion status for each generation process
  const completionStatusRef = useRef({
    quiz: false,
    flashcards: false,
    matching: false,
  });

  /**
   * Checks if all processing is complete and updates the state accordingly
   */
  const checkAllProcessingComplete = useCallback(() => {
    const { quiz, flashcards, matching } = completionStatusRef.current;

    console.log('Checking processing status:', {
      quiz,
      flashcards,
      matching,
    });

    if (quiz && flashcards && matching) {
      dispatch({ type: 'SET_PROCESSING_ALL', payload: false });
      toast.success('All learning materials generated!');

      // Reset completion status for next run
      completionStatusRef.current = {
        quiz: false,
        flashcards: false,
        matching: false,
      };
    }
  }, [dispatch]);

  /**
   * Callback handlers for quiz generation
   */
  const handleQuizSuccess = useCallback(
    (data: z.infer<typeof questionsSchema>) => {
      dispatch({ type: 'SET_QUESTIONS', payload: data });
    },
    [dispatch]
  );

  const handleQuizComplete = useCallback(() => {
    completionStatusRef.current.quiz = true;
    checkAllProcessingComplete();
  }, [checkAllProcessingComplete]);

  /**
   * Callback handlers for flashcards generation
   */
  const handleFlashcardsSuccess = useCallback(
    (data: z.infer<typeof flashcardsSchema>) => {
      dispatch({ type: 'SET_FLASHCARDS', payload: data });
    },
    [dispatch]
  );

  const handleFlashcardsComplete = useCallback(() => {
    completionStatusRef.current.flashcards = true;
    checkAllProcessingComplete();
  }, [checkAllProcessingComplete]);

  /**
   * Callback handlers for matching items generation
   */
  const handleMatchingSuccess = useCallback(
    (data: z.infer<typeof matchingItemsSchema>) => {
      dispatch({ type: 'SET_MATCHING_ITEMS', payload: data });
    },
    [dispatch]
  );

  const handleMatchingComplete = useCallback(() => {
    completionStatusRef.current.matching = true;
    checkAllProcessingComplete();
  }, [checkAllProcessingComplete]);

  // Use custom hooks for generation
  const {
    submit: submitQuiz,
    partialQuestions,
    isLoading: isLoadingQuiz,
  } = useQuizGeneration({
    onSuccess: handleQuizSuccess,
    onComplete: handleQuizComplete,
  });

  const {
    submit: submitFlashcards,
    partialFlashcards,
    isLoading: isLoadingFlashcards,
  } = useFlashcardsGeneration({
    onSuccess: handleFlashcardsSuccess,
    onComplete: handleFlashcardsComplete,
  });

  const {
    submit: submitMatchingGoogle,
    partialMatching: partialMatchingGoogle,
    isLoading: isLoadingMatchingGoogle,
  } = useMatchingGeneration({
    provider: 'google',
    onSuccess: handleMatchingSuccess,
    onComplete: handleMatchingComplete,
  });

  const {
    submit: submitMatchingOpenAI,
    partialMatching: partialMatchingOpenAI,
    isLoading: isLoadingMatchingOpenAI,
  } = useMatchingGeneration({
    provider: 'openai',
    onSuccess: handleMatchingSuccess,
    onComplete: handleMatchingComplete,
  });

  /**
   * Combined submit function that chooses the appropriate API based on the useOpenAI state
   */
  const submitMatching = (data: any) => {
    if (useOpenAI) {
      return submitMatchingOpenAI(data);
    } else {
      return submitMatchingGoogle(data);
    }
  };

  // Combined loading state
  const isLoadingMatching = useOpenAI
    ? isLoadingMatchingOpenAI
    : isLoadingMatchingGoogle;

  // Combined partial matching object
  const partialMatching = useOpenAI
    ? partialMatchingOpenAI
    : partialMatchingGoogle;

  /**
   * Handles file selection from the file input or drag and drop
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSafariBrowser() && isDragging) {
      toast.error(
        'Safari does not support drag & drop. Please use the file picker.'
      );
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) => isValidPdfFile(file));

    if (validFiles.length !== selectedFiles.length) {
      toast.error('Only PDF files under 5MB are allowed.');
    }

    dispatch({ type: 'SET_FILES', payload: validFiles });
  };

  /**
   * Handles form submission and initiates the generation process
   */
  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error('Please select a PDF file first.');
      return;
    }

    // Reset previous content
    dispatch({ type: 'SET_QUESTIONS', payload: [] });
    dispatch({ type: 'SET_FLASHCARDS', payload: [] });
    dispatch({ type: 'SET_MATCHING_ITEMS', payload: [] });

    // Reset completion status
    completionStatusRef.current = {
      quiz: false,
      flashcards: false,
      matching: false,
    };

    dispatch({ type: 'SET_PROCESSING_ALL', payload: true });
    dispatch({ type: 'SET_PDF_UPLOADED', payload: true });
    dispatch({ type: 'SET_PROCESSING_STEP', payload: 'Analyzing PDF...' });

    try {
      const encodedFiles = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type,
          data: await encodeFileAsBase64(file),
        }))
      );

      // Generate title first
      dispatch({ type: 'SET_PROCESSING_STEP', payload: 'Generating title...' });
      const generatedTitle = await generateQuizTitle(encodedFiles[0].name);
      dispatch({ type: 'SET_TITLE', payload: generatedTitle });

      // Generate all learning materials with controlled timing
      await Promise.all([
        (async () => {
          dispatch({
            type: 'SET_PROCESSING_STEP',
            payload: 'Generating quiz questions...',
          });
          return submitQuiz({ files: encodedFiles });
        })(),
        (async () => {
          dispatch({
            type: 'SET_PROCESSING_STEP',
            payload: 'Generating flashcards...',
          });
          return submitFlashcards({ files: encodedFiles });
        })(),
        (async () => {
          // Small delay to avoid race conditions
          await new Promise((resolve) => setTimeout(resolve, 500));
          dispatch({
            type: 'SET_PROCESSING_STEP',
            payload: `Generating matching game with ${
              useOpenAI ? 'OpenAI' : 'Google AI'
            }...`,
          });
          return submitMatching({ files: encodedFiles });
        })(),
      ]);

      toast.info('Generating learning materials from your PDF...');
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast.error(
        'An error occurred while processing your PDF. Please try again.'
      );
      dispatch({ type: 'SET_PROCESSING_ALL', payload: false });
    }
  };

  /**
   * Resets the state to its initial values
   */
  const clearPDF = () => {
    dispatch({ type: 'RESET_CONTENT' });
  };

  /**
   * Handles learning mode changes (quiz, flashcards, matching)
   */
  const handleModeChange = (mode: LearningMode) => {
    console.log(`Changing mode to: ${mode}`);
    dispatch({ type: 'SET_LEARNING_MODE', payload: mode });
  };

  // Calculate progress for each mode
  const quizProgress = partialQuestions
    ? (partialQuestions.length / 4) * 100
    : 0;
  const flashcardsProgress = partialFlashcards
    ? (partialFlashcards.length / 8) * 100
    : 0;
  const matchingProgress = partialMatching
    ? (partialMatching.length / 6) * 100
    : 0;

  // Determine if each mode has content
  const hasQuizContent = questions.length > 0;
  const hasFlashcardsContent = flashcards.length > 0;
  const hasMatchingContent =
    matchingItems.length > 0 &&
    matchingItems.every(
      (item) => item && item.id && item.term && item.definition
    );

  // Log detailed content information
  useEffect(() => {
    console.log('Content details:', {
      quiz: {
        hasContent: hasQuizContent,
        count: questions.length,
        items: questions,
      },
      flashcards: {
        hasContent: hasFlashcardsContent,
        count: flashcards.length,
        items: flashcards,
      },
      matching: {
        hasContent: hasMatchingContent,
        count: matchingItems.length,
        items: matchingItems,
      },
    });
  }, [
    questions,
    flashcards,
    matchingItems,
    hasQuizContent,
    hasFlashcardsContent,
    hasMatchingContent,
  ]);

  /**
   * Validates matching items when they change to ensure they have the required properties
   */
  useEffect(() => {
    if (matchingItems.length === 0) {
      // Reset the processed items set when there are no items
      processedItemsRef.current = new Set();
      return;
    }

    // Create a unique key for this set of items to avoid reprocessing
    const itemsKey = matchingItems
      .map((item) => item?.id || 'undefined')
      .join(',');

    // Skip if we've already processed these exact items
    if (processedItemsRef.current.has(itemsKey)) {
      return;
    }

    // Check if all matching items have the required properties
    const validItems = matchingItems.every(
      (item) => item && item.id && item.term && item.definition
    );

    if (!validItems) {
      console.error('Invalid matching items detected:', matchingItems);
      // Filter out invalid items
      const filteredItems = matchingItems.filter(
        (item) => item && item.id && item.term && item.definition
      );

      if (
        filteredItems.length > 0 &&
        filteredItems.length !== matchingItems.length
      ) {
        console.log('Setting filtered matching items:', filteredItems);

        // Mark these items as processed
        const newItemsKey = filteredItems.map((item) => item.id).join(',');
        processedItemsRef.current.add(newItemsKey);

        dispatch({ type: 'SET_MATCHING_ITEMS', payload: filteredItems });
      } else if (filteredItems.length === 0) {
        console.error('No valid matching items found after filtering');
        dispatch({ type: 'SET_MATCHING_ITEMS', payload: [] });
      }
    }

    // Mark these items as processed
    processedItemsRef.current.add(itemsKey);
  }, [matchingItems, dispatch]);

  // Determine if we're loading based on the current mode
  const isGenerating = {
    quiz: isLoadingQuiz,
    flashcards: isLoadingFlashcards,
    matching: isLoadingMatching,
  };

  const hasContent = {
    quiz: hasQuizContent,
    flashcards: hasFlashcardsContent,
    matching: hasMatchingContent,
  };

  // Determine the overall progress
  const overallProgress =
    (quizProgress + flashcardsProgress + matchingProgress) / 3;

  /**
   * Renders the appropriate learning content based on the current mode and state
   */
  const renderLearningContent = () => {
    if (isProcessingAll) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Processing your PDF</h3>
          <p className="text-muted-foreground text-center max-w-md">
            {processingStep || 'Analyzing PDF...'}
          </p>
        </div>
      );
    }

    if (!pdfUploaded) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No PDF uploaded yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Upload a PDF document to generate learning content.
          </p>
        </div>
      );
    }

    if (learningMode === 'flashcards' && flashcards.length > 0) {
      return (
        <Flashcards title={title} flashcards={flashcards} clearPDF={clearPDF} />
      );
    }

    if (learningMode === 'quiz' && questions.length > 0) {
      return <Quiz title={title} questions={questions} clearPDF={clearPDF} />;
    }

    if (learningMode === 'matching' && matchingItems.length > 0) {
      // Add additional validation to ensure matching items have the required properties
      const validMatchingItems = matchingItems.every(
        (item) => item && item.id && item.term && item.definition
      );

      console.log('Rendering matching component with items:', matchingItems);
      console.log('Valid matching items:', validMatchingItems);

      if (validMatchingItems) {
        return (
          <Matching
            title={`${title} (Generated by ${
              useOpenAI ? 'OpenAI' : 'Google AI'
            })`}
            matchingItems={matchingItems}
            clearPDF={clearPDF}
          />
        );
      } else {
        console.error('Invalid matching items structure detected');
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Error with matching items
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              There was an issue with the generated matching items. Please try
              uploading your PDF again.
            </p>
          </div>
        );
      }
    }

    // If the selected mode is still loading or doesn't have content yet
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        {isGenerating[learningMode] ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Generating {learningMode}...
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              We&apos;re using AI to create personalized learning materials from
              your PDF. This may take a moment.
            </p>
          </>
        ) : (
          <>
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No content available yet
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              The {learningMode} content is not available yet. Please wait for
              it to be generated or try uploading a different PDF.
            </p>
          </>
        )}
      </div>
    );
  };

  // If PDF is uploaded, show the learning interface
  if (pdfUploaded) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold">{title}</h1>
            <Button variant="outline" onClick={clearPDF}>
              Upload New PDF
            </Button>
          </div>

          <TabsNavigation
            currentMode={learningMode}
            onModeChange={handleModeChange}
            isGenerating={isGenerating}
            hasContent={hasContent}
          />

          {isProcessingAll && (
            <div className="mb-8 max-w-4xl mx-auto">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}

          <div className="bg-card max-w-4xl mx-auto border border-zinc-200 border-border rounded-lg shadow-sm">
            {renderLearningContent()}
          </div>
        </main>
      </div>
    );
  }

  // If no PDF is uploaded yet, show the upload interface
  return (
    <div
      className="min-h-[100dvh] w-full flex justify-center"
      onDragOver={(e) => {
        e.preventDefault();
        dispatch({ type: 'SET_IS_DRAGGING', payload: true });
      }}
      onDragExit={() => dispatch({ type: 'SET_IS_DRAGGING', payload: false })}
      onDragEnd={() => dispatch({ type: 'SET_IS_DRAGGING', payload: false })}
      onDragLeave={() => dispatch({ type: 'SET_IS_DRAGGING', payload: false })}
      onDrop={(e) => {
        e.preventDefault();
        dispatch({ type: 'SET_IS_DRAGGING', payload: false });
        handleFileChange({
          target: { files: e.dataTransfer.files },
        } as React.ChangeEvent<HTMLInputElement>);
      }}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none dark:bg-zinc-900/90 h-dvh w-dvw z-10 justify-center items-center flex flex-col gap-1 bg-zinc-100/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>Drag and drop files here</div>
            <div className="text-sm dark:text-zinc-400 text-zinc-500">
              {'(PDFs only)'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Card className="w-full max-w-md h-full border-0 border-zinc-200 sm:border sm:h-fit mt-12">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground">
            <div className="rounded-full bg-primary/10 p-2">
              <FileUp className="h-6 w-6" />
            </div>
            <Plus className="h-4 w-4" />
            <div className="rounded-full bg-primary/10 p-2">
              <Loader2 className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Learning Tool</CardTitle>
            <CardDescription className="text-base">
              Upload a PDF to generate interactive learning materials based on
              its content.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitWithFiles} className="space-y-4">
            <div
              className={`relative flex flex-col items-center justify-center border-2 border-zinc-200 border-dashed rounded-lg p-6 transition-colors hover:border-zinc-600`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileUp className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                {files.length > 0 ? (
                  <span className="font-medium text-foreground">
                    {files[0].name}
                  </span>
                ) : (
                  <span>Drop your PDF here or click to browse.</span>
                )}
              </p>
            </div>
            <Button
              type="submit"
              color="primary"
              variant="default"
              className="w-full"
              disabled={files.length === 0 || isProcessingAll}
            >
              {isProcessingAll ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing PDF...</span>
                </span>
              ) : (
                'Generate Learning Materials'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
