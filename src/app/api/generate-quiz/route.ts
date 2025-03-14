import { questionSchema, questionsSchema } from '@/lib/schemas';
import { createGoogleGenerativeAI, google } from '@ai-sdk/google';
import { streamObject } from 'ai';

export const maxDuration = 60;

// Configure Google API with the API key from environment variables
const googleApiKey = process.env.GOOGLE_API_KEY;

export async function POST(req: Request) {
  // return new Response(
  //   JSON.stringify({
  //     error:
  //       'Google API key is not configured. Please set GOOGLE_API_KEY in your environment variables.',
  //   }),
  //   { status: 500 }
  // );

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
            'You are a teacher. Your job is to take a document, and create a multiple choice test (with 4 questions) based on the content of the document. Each option should be roughly equal in length.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Create a multiple choice test based on this document.',
            },
            {
              type: 'file',
              data: firstFile,
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
      schema: questionSchema,
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
      const questions = JSON.parse(jsonText);

      if (!Array.isArray(questions)) {
        throw new Error('Expected an array of questions');
      }

      // Validate against schema
      const validationResult = questionsSchema.safeParse(questions);
      if (!validationResult.success) {
        console.error('Validation error:', validationResult.error);
        throw new Error('Failed to validate questions');
      }

      // Return the validated questions
      return new Response(JSON.stringify(questions), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error processing questions:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to process questions',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in generate-quiz route:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate quiz questions',
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
