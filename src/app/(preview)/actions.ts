'use server';

import { createGoogleGenerativeAI, google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Configure Google API with the API key from environment variables
const googleApiKey = process.env.GOOGLE_API_KEY;

export const generateQuizTitle = async (file: string) => {
  if (!googleApiKey) {
    throw new Error(
      'Google API key is not configured. Please set GOOGLE_API_KEY in your environment variables.'
    );
  }

  // Create a custom Google provider instance with the API key
  const googleProvider = createGoogleGenerativeAI({
    apiKey: googleApiKey,
  });

  const result = await generateObject({
    model: googleProvider('gemini-1.5-flash-latest'),
    schema: z.object({
      title: z
        .string()
        .describe(
          'A max three word title for the quiz based on the file provided as context'
        ),
    }),
    prompt:
      'Generate a title for a quiz based on the attached file content. Try and extract as much info from the file content as possible. If the file content is just numbers or incoherent, just return quiz.\n\n ' +
      file,
  });
  return result.object.title;
};
