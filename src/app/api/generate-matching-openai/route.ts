import { matchingItemSchema, matchingItemsSchema } from '@/lib/schemas';
import { createOpenAI } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { debugLog } from '@/lib/utils';

export const maxDuration = 60;

// Configure OpenAI API with the API key from environment variables
const openaiApiKey = process.env.OPENAI_API_KEY;

export async function POST(req: Request) {
  console.log('OpenAI matching route called');

  try {
    const { files } = await req.json();
    console.log('Files received:', files.length);
    const firstFile = files[0].data;

    if (!openaiApiKey) {
      console.error('OpenAI API key is missing');
      return new Response(
        JSON.stringify({
          error:
            'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a custom OpenAI provider instance with the API key
    const openaiProvider = createOpenAI({
      apiKey: openaiApiKey,
    });

    console.log('Starting matching items generation with OpenAI');

    // Define the schema for a single matching item without ID
    const matchingItemWithoutIdSchema = matchingItemSchema
      .omit({ id: true })
      .extend({
        term: matchingItemSchema.shape.term,
        definition: matchingItemSchema.shape.definition,
      });

    try {
      // Create a custom stream handler that adds IDs to the items
      console.log('Creating streamObject with OpenAI');
      const result = streamObject({
        model: openaiProvider('gpt-4-turbo'),
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

        console.log('Generated matching items with OpenAI:', itemsWithIds);

        // Validate the generated items
        const res = matchingItemsSchema.safeParse(itemsWithIds);
        if (res.error) {
          console.error('Validation error:', res.error.errors);
        } else {
          console.log('Validation successful');
        }

        // Return the items with IDs
        return new Response(JSON.stringify(itemsWithIds), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('Error processing matching items:', parseError);
        return new Response(
          JSON.stringify({ error: 'Failed to process matching items' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (streamError: any) {
      console.error('Error in streamObject:', streamError);
      return new Response(
        JSON.stringify({
          error: 'Failed to generate matching items with OpenAI: Stream error',
          details: streamError?.message || 'Unknown stream error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error: any) {
    console.error('Error in generate-matching-openai route:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate matching items with OpenAI',
        details: error?.message || 'Unknown error',
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
