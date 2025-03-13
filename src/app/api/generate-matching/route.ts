import { matchingItemSchema, matchingItemsSchema } from '@/lib/schemas';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { v4 as uuidv4 } from 'uuid';

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
          'You are a teacher. Your job is to take a document, and create a set of matching items (with 6 pairs) based on the content of the document. Each matching item should have a term and a definition that matches the term.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Create a set of matching items based on this document.',
          },
          {
            type: 'file',
            data: firstFile,
            mimeType: 'application/pdf',
          },
        ],
      },
    ],
    schema: matchingItemSchema.omit({ id: true }).extend({
      term: matchingItemSchema.shape.term,
      definition: matchingItemSchema.shape.definition,
    }),
    output: 'array',
    onFinish: ({ object }) => {
      // Add IDs to each matching item
      const objectWithIds = object?.map((item: any) => ({
        ...item,
        id: uuidv4(),
      }));

      const res = matchingItemsSchema.safeParse(objectWithIds);
      if (res.error) {
        throw new Error(res.error.errors.map((e) => e.message).join('\n'));
      }
    },
  });

  return result.toTextStreamResponse();
}
