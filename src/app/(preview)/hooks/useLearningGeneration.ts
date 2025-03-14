import { experimental_useObject } from '@ai-sdk/react';
import { questionsSchema, flashcardsSchema } from '@/lib/schemas';
import { toast } from 'sonner';
import { z } from 'zod';

type UseQuizGenerationProps = {
  onSuccess: (items: z.infer<typeof questionsSchema>) => void;
  onComplete: () => void;
};

export function useQuizGeneration({
  onSuccess,
  onComplete,
}: UseQuizGenerationProps) {
  const {
    submit,
    object: partialQuestions,
    isLoading,
  } = experimental_useObject({
    api: '/api/generate-quiz',
    schema: questionsSchema,
    initialValue: [],
    onError: (error: any) => {
      console.error('Quiz generation error:', error);
      toast.error('Failed to generate quiz. Please try again.');
      onComplete();
    },
    onFinish: ({ object }) => {
      console.log('Quiz generated:', object);
      if (object && Array.isArray(object)) {
        onSuccess(object);
      }
      onComplete();
    },
  });

  return { submit, partialQuestions, isLoading };
}

type UseFlashcardsGenerationProps = {
  onSuccess: (items: z.infer<typeof flashcardsSchema>) => void;
  onComplete: () => void;
};

export function useFlashcardsGeneration({
  onSuccess,
  onComplete,
}: UseFlashcardsGenerationProps) {
  const {
    submit,
    object: partialFlashcards,
    isLoading,
  } = experimental_useObject({
    api: '/api/generate-flashcards',
    schema: flashcardsSchema,
    initialValue: [],
    onError: (error) => {
      console.error('Flashcards generation error:', error);
      toast.error('Failed to generate flashcards. Please try again.');
      onComplete();
    },
    onFinish: ({ object }) => {
      console.log('Flashcards generated:', object);
      if (object && Array.isArray(object)) {
        onSuccess(object);
      }
      onComplete();
    },
  });

  return { submit, partialFlashcards, isLoading };
}
