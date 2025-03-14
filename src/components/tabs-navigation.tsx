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
    debugLog('TabsNavigation state', {
      currentMode,
      isGenerating,
      hasContent,
    });
  }, [currentMode, isGenerating, hasContent]);

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TabItem
          mode="flashcards"
          currentMode={currentMode}
          onModeChange={onModeChange}
          isGenerating={isGenerating.flashcards}
          hasContent={hasContent.flashcards}
          icon={<BookOpen className="h-5 w-5" />}
          label="Flashcards"
        />
        <TabItem
          mode="quiz"
          currentMode={currentMode}
          onModeChange={onModeChange}
          isGenerating={isGenerating.quiz}
          hasContent={hasContent.quiz}
          icon={<FileText className="h-5 w-5" />}
          label="Test"
        />
        <TabItem
          mode="matching"
          currentMode={currentMode}
          onModeChange={onModeChange}
          isGenerating={isGenerating.matching}
          hasContent={hasContent.matching}
          icon={<Layers className="h-5 w-5" />}
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
  badge?: string;
};

function TabItem({
  mode,
  currentMode,
  onModeChange,
  isGenerating,
  hasContent,
  icon,
  label,
  badge,
}: TabItemProps) {
  const isActive = currentMode === mode;

  const handleClick = () => {
    debugLog(`Tab clicked: ${mode}`, { isGenerating, hasContent });
    onModeChange(mode);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isGenerating}
      className={`cursor-pointer flex items-center justify-center px-4 py-2 rounded-lg transition-all ${
        isActive
          ? 'bg-primary/10 text-primary border-b border-b-4 border-primary'
          : 'bg-card hover:bg-accent/50 text-muted-foreground hover:text-foreground'
      }`}
    >
      <div className="text-left">
        <div className="flex items-center gap-2">
          <div
            className={`flex-shrink-0 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {icon}
          </div>
          <span className="text-sm font-medium">{label}</span>
          {badge && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
              {badge}
            </span>
          )}
          {isGenerating && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Generating...
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
