
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface TopicInputProps {
  onStartDebate: (topic: string) => void;
  isLoading: boolean;
}

const TopicInput: React.FC<TopicInputProps> = ({ onStartDebate, isLoading }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onStartDebate(topic.trim());
      // setTopic(''); // Optionally clear after submit, or let parent manage
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a debate topic..."
          className="flex-1 bg-white dark:bg-gray-800"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !topic.trim()}>
          <Send className="w-4 h-4 mr-2" />
          {isLoading ? 'Starting...' : 'Start Debate'}
        </Button>
      </div>
    </form>
  );
};

export default TopicInput;
