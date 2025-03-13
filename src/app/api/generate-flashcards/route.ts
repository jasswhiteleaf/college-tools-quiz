import { flashcardSchema, flashcardsSchema } from '@/lib/schemas';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';

export const maxDuration = 60;

// Configure Google API with the API key from environment variables
const googleApiKey = process.env.GOOGLE_API_KEY;

export async function POST(req: Request) {
  const { files } = await req.json();
  const firstFile = files[0].data;

  if (!googleApiKey) {
    return new Response(
      JSON.stringify({
        error:
          'Google API key is not configured. Please set GOOGLE_API_KEY in your environment variables.',
      }),
      { status: 500 }
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
    onFinish: ({ object }) => {
      const res = flashcardsSchema.safeParse(object);
      if (res.error) {
        throw new Error(res.error.errors.map((e) => e.message).join('\n'));
      }
    },
  });

  return result.toTextStreamResponse();
}
