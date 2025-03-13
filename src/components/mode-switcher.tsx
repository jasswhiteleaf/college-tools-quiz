import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LearningMode } from '@/lib/schemas';

type ModeSwitcherProps = {
  currentMode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
};

export default function ModeSwitcher({
  currentMode,
  onModeChange,
}: ModeSwitcherProps) {
  return (
    <div className="absolute top-4 left-4 z-10">
      <Select
        value={currentMode}
        onValueChange={(value: string) => onModeChange(value as LearningMode)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Learning Mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="quiz">Quiz</SelectItem>
          <SelectItem value="flashcards">Flashcards</SelectItem>
          <SelectItem value="matching">Matching</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
