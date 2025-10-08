import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';

interface FeedbackModalProps {
  onSubmit: (feedback: string) => Promise<void>;
  onClose: () => void;
}

export default function FeedbackModal({ onSubmit, onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    setLoading(true);
    try {
      await onSubmit(feedback);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Add more detail to the testing phase',
    'Break down the development task into smaller subtasks',
    'Add a buffer period before the deadline',
    'Include a user acceptance testing phase',
    'Add documentation tasks',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Refine Your Plan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600">
            Tell the AI how you’d like to improve your plan. It will review your current plan and make adjustments based on your feedback.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., Add more buffer time between tasks, include a code review phase, make testing more detailed..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={6}
              disabled={loading}
            />
          </div>

          {/* Suggestions */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setFeedback(suggestion)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !feedback.trim()}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Refining...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Refine Plan</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
