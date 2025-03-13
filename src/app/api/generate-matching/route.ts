import { matchingItemSchema, matchingItemsSchema } from '@/lib/schemas';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { debugLog } from '@/lib/utils';

export const maxDuration = 60;

// Configure Google API with the API key from environment variables
const googleApiKey = process.env.GOOGLE_API_KEY;

export async function POST(req: Request) {
  try {
    const { files } = await req.json();
    const firstFile = files[0].data;

    if (!googleApiKey) {
      console.error('Google API key is missing');
      return new Response(
        JSON.stringify({
          error:
            'Google API key is not configured. Please set GOOGLE_API_KEY in your environment variables.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a custom Google provider instance with the API key
    const googleProvider = createGoogleGenerativeAI({
      apiKey: googleApiKey,
    });

    console.log('Starting matching items generation');

    // Define the schema for a single matching item without ID
    const matchingItemWithoutIdSchema = matchingItemSchema
      .omit({ id: true })
      .extend({
        term: matchingItemSchema.shape.term,
        definition: matchingItemSchema.shape.definition,
      });

    // Use the streamObject directly and return its response
    const result = streamObject({
      model: googleProvider('gemini-1.5-pro-latest'),
      messages: [
        {
          role: 'system',
          content:
            'You are a teacher. Your job is to take a document, and create a set of matching items (with 6 pairs) based on the content of the document. Each matching item should have a term and a definition that matches the term. Make sure each term and definition pair is clearly related and can be matched together. Ensure both term and definition are non-empty strings with at least 5 characters each.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Create a set of matching items based on this document. Return exactly 6 pairs of terms and definitions. Each term and definition must be non-empty and meaningful.',
            },
            {
              type: 'file',
              data: firstFile,
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
      schema: matchingItemWithoutIdSchema,
      output: 'array',
      onFinish: ({ object }) => {
        if (!object || !Array.isArray(object) || object.length === 0) {
          console.error(
            'Failed to generate matching items: Empty or invalid response'
          );
          return;
        }

        // Add IDs to each matching item and ensure all required fields are present
        const objectWithIds = object
          .map((item: any) => {
            // Ensure item has all required fields
            if (!item.term || !item.definition) {
              console.error('Invalid matching item:', item);
              return null;
            }

            return {
              ...item,
              id: uuidv4(),
              // Ensure term and definition are strings and not empty
              term: typeof item.term === 'string' ? item.term : 'Unknown term',
              definition:
                typeof item.definition === 'string'
                  ? item.definition
                  : 'Unknown definition',
            };
          })
          .filter(Boolean); // Remove any null items

        console.log('Generated matching items:', objectWithIds);

        // Validate the generated items
        const res = matchingItemsSchema.safeParse(objectWithIds);
        if (res.error) {
          console.error('Validation error:', res.error.errors);
        }
      },
    });

    // Return the stream response directly
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in generate-matching route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate matching items' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
