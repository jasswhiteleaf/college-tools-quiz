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

    // Create a custom stream handler that adds IDs to the items
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
    });

    // Create a custom stream that adds IDs to each item
    const { textStream } = result;
    let jsonText = '';

    // Collect the JSON text
    for await (const chunk of textStream) {
      jsonText += chunk;
    }

    // Parse the complete JSON and add IDs
    try {
      const items = JSON.parse(jsonText);

      if (!Array.isArray(items)) {
        throw new Error('Expected an array of items');
      }

      // Add IDs to each item
      const itemsWithIds = items
        .map((item) => {
          if (!item || !item.term || !item.definition) {
            return null;
          }

          return {
            ...item,
            id: uuidv4(),
            term: typeof item.term === 'string' ? item.term : 'Unknown term',
            definition:
              typeof item.definition === 'string'
                ? item.definition
                : 'Unknown definition',
          };
        })
        .filter(Boolean);

      console.log('Generated matching items with IDs:', itemsWithIds);

      // Return the items with IDs
      return new Response(JSON.stringify(itemsWithIds), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error processing matching items:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to process matching items' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
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
