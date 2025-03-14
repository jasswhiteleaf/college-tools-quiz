import '@/styles/globals.css';
import { Metadata } from 'next';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { Geist } from 'next/font/google';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Learning Tool',
  description: 'Generate quizzes, flashcards, and matching games from PDFs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.className}`}>
      <body>
        <ThemeProvider attribute="class" enableSystem forcedTheme="light">
          <Toaster position="top-center" richColors />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
