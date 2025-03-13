import React from 'react';
import { LearningMode } from '@/lib/schemas';
import { FileText, BookOpen, Layers } from 'lucide-react';
import { debugLog } from '@/lib/utils';

type TabsNavigationProps = {
  currentMode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
  isGenerating: {
    quiz: boolean;
    flashcards: boolean;
    matching: boolean;
  };
  hasContent: {
    quiz: boolean;
    flashcards: boolean;
    matching: boolean;
  };
};

export default function TabsNavigation({
  currentMode,
  onModeChange,
  isGenerating,
  hasContent,
}: TabsNavigationProps) {
  // Log the current state for debugging
  React.useEffect(() => {
    console.log('TabsNavigation state', {
      currentMode,
      isGenerating,
      hasContent,
    });
  }, [currentMode, isGenerating, hasContent]);

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="grid grid-cols-3 gap-4">
        <TabItem
          mode="flashcards"
          currentMode={currentMode}
          onModeChange={onModeChange}
          isGenerating={isGenerating.flashcards}
          hasContent={hasContent.flashcards}
          icon={<BookOpen className="h-6 w-6" />}
          label="Flashcards"
        />
        <TabItem
          mode="quiz"
          currentMode={currentMode}
          onModeChange={onModeChange}
          isGenerating={isGenerating.quiz}
          hasContent={hasContent.quiz}
          icon={<FileText className="h-6 w-6" />}
          label="Test"
        />
        <TabItem
          mode="matching"
          currentMode={currentMode}
          onModeChange={onModeChange}
          isGenerating={isGenerating.matching}
          hasContent={hasContent.matching}
          icon={<Layers className="h-6 w-6" />}
          label="Match"
        />
      </div>
    </div>
  );
}

type TabItemProps = {
  mode: LearningMode;
  currentMode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
  isGenerating: boolean;
  hasContent: boolean;
  icon: React.ReactNode;
  label: string;
};

function TabItem({
  mode,
  currentMode,
  onModeChange,
  isGenerating,
  hasContent,
  icon,
  label,
}: TabItemProps) {
  const isActive = currentMode === mode;

  const handleClick = () => {
    console.log(`Tab clicked: ${mode}`, { isGenerating, hasContent });
    onModeChange(mode);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isGenerating}
      className={`flex items-center justify-center p-4 rounded-lg transition-all ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'bg-card hover:bg-accent/50 text-muted-foreground hover:text-foreground'
      }`}
    >
      <div className="flex flex-col items-center space-y-2">
        <div className={`rounded-full p-2 ${isActive ? 'bg-primary/10' : ''}`}>
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
        {isGenerating && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Generating...
          </span>
        )}
      </div>
    </button>
  );
}
