import { z } from 'zod';

export const questionSchema = z.object({
  question: z.string(),
  options: z
    .array(z.string())
    .length(4)
    .describe(
      'Four possible answers to the question. Only one should be correct. They should all be of equal lengths.'
    ),
  answer: z
    .enum(['A', 'B', 'C', 'D'])
    .describe(
      'The correct answer, where A is the first option, B is the second, and so on.'
    ),
});

export type Question = z.infer<typeof questionSchema>;

export const questionsSchema = z.array(questionSchema).length(4);

// Flashcard schema
export const flashcardSchema = z.object({
  front: z
    .string()
    .describe('The question or prompt on the front of the flashcard'),
  back: z
    .string()
    .describe('The answer or explanation on the back of the flashcard'),
});

export type Flashcard = z.infer<typeof flashcardSchema>;

export const flashcardsSchema = z.array(flashcardSchema).length(8);

// Matching schema
export const matchingItemSchema = z.object({
  id: z.string().describe('Unique identifier for the matching item'),
  term: z.string().min(1).describe('The term to be matched'),
  definition: z
    .string()
    .min(1)
    .describe('The definition that matches the term'),
});

export type MatchingItem = z.infer<typeof matchingItemSchema>;

export const matchingItemsSchema = z.array(matchingItemSchema).length(6);

// Learning mode type
export const learningModeSchema = z.enum(['quiz', 'flashcards', 'matching']);

export type LearningMode = z.infer<typeof learningModeSchema>;
