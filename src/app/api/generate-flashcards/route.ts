import { flashcardSchema, flashcardsSchema } from '@/lib/schemas';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';

export const maxDuration = 60;

// Configure Google API with the API key from environment variables
const googleApiKey = process.env.GOOGLE_API_KEY;

export async function POST(req: Request) {
  try {
    const { files } = await req.json();
    const firstFile = files[0].data;

    if (!googleApiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Google API key is not configured. Please set GOOGLE_API_KEY in your environment variables.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create a custom Google provider instance with the API key
    const googleProvider = createGoogleGenerativeAI({
      apiKey: googleApiKey,
    });

    const result = streamObject({
      model: googleProvider('gemini-1.5-pro-latest'),
      messages: [
        {
          role: 'system',
          content:
            'You are a teacher. Your job is to take a document, and create a set of flashcards (with 8 cards) based on the content of the document. Each flashcard should have a front (question/prompt) and back (answer/explanation).',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Create a set of flashcards based on this document.',
            },
            {
              type: 'file',
              data: firstFile,
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
      schema: flashcardSchema,
      output: 'array',
    });

    // Create a custom stream to collect the complete response
    const { textStream } = result;
    let jsonText = '';

    // Collect the JSON text
    for await (const chunk of textStream) {
      jsonText += chunk;
    }

    // Parse the complete JSON and validate
    try {
      const flashcards = JSON.parse(jsonText);

      if (!Array.isArray(flashcards)) {
        throw new Error('Expected an array of flashcards');
      }

      // Validate against schema
      const validationResult = flashcardsSchema.safeParse(flashcards);
      if (!validationResult.success) {
        console.error('Validation error:', validationResult.error);
        throw new Error('Failed to validate flashcards');
      }

      // Return the validated flashcards
      return new Response(JSON.stringify(flashcards), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error processing flashcards:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to process flashcards',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in generate-flashcards route:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate flashcards',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
