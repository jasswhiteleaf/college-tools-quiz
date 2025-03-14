This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### API Keys Setup

This application uses AI APIs for generating quiz content. You need to set up API keys:

1. Get a Google Gemini API key from [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)
2. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
3. Create a `.env.local` file in the root directory of the project
4. Add your API keys to the `.env.local` file:
   ```
   GOOGLE_API_KEY=your_google_gemini_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### AI Provider Options

This application supports multiple AI providers for generating learning content:

- **Google Gemini**: Used for generating quiz questions, flashcards, and matching items
- **OpenAI**: Can be used as an alternative for generating matching items

When using the matching game feature, you can select which AI provider to use from the dropdown menu.

### Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
