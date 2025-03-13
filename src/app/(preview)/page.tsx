'use client';

import { useState, useEffect, useRef } from 'react';
import { experimental_useObject } from 'ai/react';
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

export default function LearningTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<z.infer<typeof questionsSchema>>(
    []
  );
  const [flashcards, setFlashcards] = useState<
    z.infer<typeof flashcardsSchema>
  >([]);
  const [matchingItems, setMatchingItems] = useState<
    z.infer<typeof matchingItemsSchema>
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState<string>('Learning Material');
  const [learningMode, setLearningMode] = useState<LearningMode>('flashcards');
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  // Quiz generation
  const {
    submit: submitQuiz,
    object: partialQuestions,
    isLoading: isLoadingQuiz,
  } = experimental_useObject({
    api: '/api/generate-quiz',
    schema: questionsSchema,
    initialValue: [],
    onError: (error) => {
      console.error('Quiz generation error:', error);
      toast.error('Failed to generate quiz. Please try again.');
    },
    onFinish: ({ object }) => {
      console.log('Quiz generated:', object);
      if (object && Array.isArray(object)) {
        setQuestions(object);
      }
      checkAllProcessingComplete();
    },
  });

  // Flashcards generation
  const {
    submit: submitFlashcards,
    object: partialFlashcards,
    isLoading: isLoadingFlashcards,
  } = experimental_useObject({
    api: '/api/generate-flashcards',
    schema: flashcardsSchema,
    initialValue: [],
    onError: (error) => {
      console.error('Flashcards generation error:', error);
      toast.error('Failed to generate flashcards. Please try again.');
    },
    onFinish: ({ object }) => {
      console.log('Flashcards generated:', object);
      if (object && Array.isArray(object)) {
        setFlashcards(object);
      }
      checkAllProcessingComplete();
    },
  });

  // Matching generation
  const {
    submit: submitMatching,
    object: partialMatching,
    isLoading: isLoadingMatching,
  } = experimental_useObject({
    api: '/api/generate-matching',
    schema: matchingItemsSchema,
    initialValue: [],
    onError: (error) => {
      console.error('Matching generation error:', error);
      toast.error('Failed to generate matching game. Please try again.');
    },
    onFinish: ({ object }) => {
      console.log('Matching items generated:', object);

      // Handle potential undefined object
      if (!object) {
        console.error('Invalid matching items received: undefined');
        setMatchingItems([]);
        checkAllProcessingComplete();
        return;
      }

      // Ensure object is an array
      if (Array.isArray(object)) {
        console.log(
          `Setting ${object.length} matching items to state:`,
          object
        );

        // Validate each item in the array
        const validItems = object.filter(
          (item) =>
            item &&
            typeof item === 'object' &&
            item.id &&
            typeof item.term === 'string' &&
            item.term.length > 0 &&
            typeof item.definition === 'string' &&
            item.definition.length > 0
        );

        if (validItems.length > 0) {
          setMatchingItems(validItems);
          debugLog('Matching items set successfully:', validItems);
        } else {
          console.error('No valid matching items found in response');
          setMatchingItems([]);
        }
      } else {
        console.error('Invalid matching items received:', object);
        setMatchingItems([]);
      }

      checkAllProcessingComplete();
    },
  });

  // Check if all processing is complete
  const checkAllProcessingComplete = () => {
    console.log('Checking processing status:', {
      quiz: isLoadingQuiz,
      flashcards: isLoadingFlashcards,
      matching: isLoadingMatching,
    });

    if (!isLoadingQuiz && !isLoadingFlashcards && !isLoadingMatching) {
      setIsProcessingAll(false);
      toast.success('All learning materials generated!');
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari && isDragging) {
      toast.error(
        'Safari does not support drag & drop. Please use the file picker.'
      );
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== selectedFiles.length) {
      toast.error('Only PDF files under 5MB are allowed.');
    }

    setFiles(validFiles);
  };

  // Encode file as base64
  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle form submission
  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error('Please select a PDF file first.');
      return;
    }

    // Reset previous content
    setQuestions([]);
    setFlashcards([]);
    setMatchingItems([]);

    setIsProcessingAll(true);
    setPdfUploaded(true);

    const encodedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await encodeFileAsBase64(file),
      }))
    );

    // Generate title first
    const generatedTitle = await generateQuizTitle(encodedFiles[0].name);
    setTitle(generatedTitle);

    // Generate all learning materials in parallel
    submitQuiz({ files: encodedFiles });
    submitFlashcards({ files: encodedFiles });

    // Add a small delay before submitting matching to avoid potential race conditions
    setTimeout(() => {
      console.log('Submitting matching generation request');
      submitMatching({ files: encodedFiles });
    }, 1000); // Increased delay to 1 second

    toast.info('Generating learning materials from your PDF...');
  };

  // Reset everything
  const clearPDF = () => {
    setFiles([]);
    setQuestions([]);
    setFlashcards([]);
    setMatchingItems([]);
    setPdfUploaded(false);
    setTitle('Learning Material');
  };

  // Handle mode change
  const handleModeChange = (mode: LearningMode) => {
    console.log(`Changing mode to: ${mode}`);
    setLearningMode(mode);
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

  // Add validation for matching items when they change
  const processedItemsRef = useRef<Set<string>>(new Set());

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

        setMatchingItems(filteredItems);
      } else if (filteredItems.length === 0) {
        console.error('No valid matching items found after filtering');
        setMatchingItems([]);
      }
    }

    // Mark these items as processed
    processedItemsRef.current.add(itemsKey);
  }, [matchingItems]);

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

  // Render the learning content based on the selected mode
  const renderLearningContent = () => {
    console.log('Rendering content for mode:', learningMode, {
      hasQuizContent,
      hasFlashcardsContent,
      hasMatchingContent,
      quizLength: questions.length,
      flashcardsLength: flashcards.length,
      matchingLength: matchingItems.length,
    });

    if (learningMode === 'quiz' && questions.length > 0) {
      return <Quiz title={title} questions={questions} clearPDF={clearPDF} />;
    }

    if (learningMode === 'flashcards' && flashcards.length > 0) {
      console.log('Rendering flashcards component with items:', flashcards);
      return (
        <Flashcards title={title} flashcards={flashcards} clearPDF={clearPDF} />
      );
    }

    console.log('matchingItems', matchingItems);

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
            title={title}
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
            <div className="mb-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}

          <div className="bg-card border rounded-lg shadow-sm">
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
        setIsDragging(true);
      }}
      onDragExit={() => setIsDragging(false)}
      onDragEnd={() => setIsDragging(false)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
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
            <CardTitle className="text-2xl font-bold">
              PDF Learning Tool
            </CardTitle>
            <CardDescription className="text-base">
              Upload a PDF to generate interactive learning materials based on
              its content using the{' '}
              <Link href="https://sdk.vercel.ai">AI SDK</Link> and{' '}
              <Link href="https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai">
                Google&apos;s Gemini Pro
              </Link>
              .
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
