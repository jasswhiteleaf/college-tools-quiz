import { experimental_useObject } from '@ai-sdk/react';
import { matchingItemsSchema } from '@/lib/schemas';
import { toast } from 'sonner';
import { z } from 'zod';
import { debugLog } from '@/lib/utils';

// Utility function for validating matching items
export const validateMatchingItems = (
  items: any
): z.infer<typeof matchingItemsSchema> => {
  if (!items) {
    console.error('Invalid matching items received: undefined');
    return [];
  }

  if (!Array.isArray(items)) {
    console.error('Invalid matching items received:', items);
    return [];
  }

  const validItems = items.filter(
    (item) =>
      item &&
      typeof item === 'object' &&
      item.id &&
      typeof item.term === 'string' &&
      item.term.length > 0 &&
      typeof item.definition === 'string' &&
      item.definition.length > 0
  );

  if (validItems.length === 0) {
    console.error('No valid matching items found in response');
  }

  return validItems;
};

type UseMatchingGenerationProps = {
  provider: 'openai' | 'google';
  onSuccess: (items: z.infer<typeof matchingItemsSchema>) => void;
  onComplete: () => void;
};

export function useMatchingGeneration({
  provider,
  onSuccess,
  onComplete,
}: UseMatchingGenerationProps) {
  const apiEndpoint =
    provider === 'openai'
      ? '/api/generate-matching-openai'
      : '/api/generate-matching';

  const {
    submit,
    object: partialMatching,
    isLoading,
  } = experimental_useObject({
    api: apiEndpoint,
    schema: matchingItemsSchema,
    initialValue: [],
    onError: (error) => {
      console.error(`Matching generation error (${provider}):`, error);
      toast.error(
        `Failed to generate matching game with ${
          provider === 'openai' ? 'OpenAI' : 'Google AI'
        }. Please try again.`
      );
      onComplete();
    },
    onFinish: ({ object }) => {
      console.log(`Matching items generated with ${provider}:`, object);
      const validItems = validateMatchingItems(object);

      if (validItems.length > 0) {
        onSuccess(validItems);
        debugLog('Matching items set successfully:', validItems);
      }

      onComplete();
    },
  });

  return { submit, partialMatching, isLoading };
}
