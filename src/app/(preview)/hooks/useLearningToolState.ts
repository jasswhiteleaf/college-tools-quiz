import { useReducer } from 'react';
import { z } from 'zod';
import {
  questionsSchema,
  flashcardsSchema,
  matchingItemsSchema,
  LearningMode,
} from '@/lib/schemas';

// Define the state interface
export interface LearningToolState {
  files: File[];
  title: string;
  questions: z.infer<typeof questionsSchema>;
  flashcards: z.infer<typeof flashcardsSchema>;
  matchingItems: z.infer<typeof matchingItemsSchema>;
  learningMode: LearningMode;
  processingStep: string;
  pdfUploaded: boolean;
  isProcessingAll: boolean;
  useOpenAI: boolean;
  isDragging: boolean;
}

// Define action types for the reducer
export type LearningToolAction =
  | { type: 'SET_FILES'; payload: File[] }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_QUESTIONS'; payload: z.infer<typeof questionsSchema> }
  | { type: 'SET_FLASHCARDS'; payload: z.infer<typeof flashcardsSchema> }
  | { type: 'SET_MATCHING_ITEMS'; payload: z.infer<typeof matchingItemsSchema> }
  | { type: 'SET_LEARNING_MODE'; payload: LearningMode }
  | { type: 'SET_PROCESSING_STEP'; payload: string }
  | { type: 'SET_PDF_UPLOADED'; payload: boolean }
  | { type: 'SET_PROCESSING_ALL'; payload: boolean }
  | { type: 'SET_USE_OPENAI'; payload: boolean }
  | { type: 'SET_IS_DRAGGING'; payload: boolean }
  | { type: 'RESET_CONTENT' };

// Initial state
export const initialState: LearningToolState = {
  files: [],
  title: 'Learning Content',
  questions: [],
  flashcards: [],
  matchingItems: [],
  learningMode: 'flashcards',
  processingStep: 'Analyzing PDF...',
  pdfUploaded: false,
  isProcessingAll: false,
  useOpenAI: false,
  isDragging: false,
};

// Reducer function
export function learningToolReducer(
  state: LearningToolState,
  action: LearningToolAction
): LearningToolState {
  switch (action.type) {
    case 'SET_FILES':
      return { ...state, files: action.payload };
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    case 'SET_FLASHCARDS':
      return { ...state, flashcards: action.payload };
    case 'SET_MATCHING_ITEMS':
      return { ...state, matchingItems: action.payload };
    case 'SET_LEARNING_MODE':
      return { ...state, learningMode: action.payload };
    case 'SET_PROCESSING_STEP':
      return { ...state, processingStep: action.payload };
    case 'SET_PDF_UPLOADED':
      return { ...state, pdfUploaded: action.payload };
    case 'SET_PROCESSING_ALL':
      return { ...state, isProcessingAll: action.payload };
    case 'SET_USE_OPENAI':
      return { ...state, useOpenAI: action.payload };
    case 'SET_IS_DRAGGING':
      return { ...state, isDragging: action.payload };
    case 'RESET_CONTENT':
      return {
        ...state,
        files: [],
        questions: [],
        flashcards: [],
        matchingItems: [],
        pdfUploaded: false,
        title: 'Learning Material',
      };
    default:
      return state;
  }
}

// Custom hook to use the learning tool state
export function useLearningToolState() {
  const [state, dispatch] = useReducer(learningToolReducer, initialState);
  return { state, dispatch };
}
