import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Task } from '@/lib/api';

interface TaskEditorProps {
  task: Task;
  allTasks: Task[];
  onSave: (updates: Partial<Task>) => void;
  onClose: () => void;
}

export default function TaskEditor({ task, allTasks, onSave, onClose }: TaskEditorProps) {
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description || '');
  const [optimistic, setOptimistic] = useState(task.optimistic_duration);
  const [mostLikely, setMostLikely] = useState(task.most_likely_duration);
  const [pessimistic, setPessimistic] = useState(task.pessimistic_duration);
  const [dependencies, setDependencies] = useState<number[]>(task.dependencies);

  const handleSave = () => {
    onSave({
      name,
      description,
      optimistic_duration: optimistic,
      most_likely_duration: mostLikely,
      pessimistic_duration: pessimistic,
      dependencies,
    });
  };

  const toggleDependency = (taskIndex: number) => {
    if (dependencies.includes(taskIndex)) {
      setDependencies(dependencies.filter(d => d !== taskIndex));
    } else {
      setDependencies([...dependencies, taskIndex]);
    }
  };

  const taskIndex = allTasks.findIndex(t => t.id === task.id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="Enter task name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
              rows={3}
              placeholder="Enter task description (optional)"
            />
          </div>

          {/* PERT Durations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Duration Estimates (days)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Optimistic</label>
                <input
                  type="number"
                  value={optimistic}
                  onChange={(e) => setOptimistic(parseFloat(e.target.value) || 0)}
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Most Likely</label>
                <input
                  type="number"
                  value={mostLikely}
                  onChange={(e) => setMostLikely(parseFloat(e.target.value) || 0)}
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Pessimistic</label>
                <input
                  type="number"
                  value={pessimistic}
                  onChange={(e) => setPessimistic(parseFloat(e.target.value) || 0)}
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Expected duration: {((optimistic + 4 * mostLikely + pessimistic) / 6).toFixed(1)} days
            </p>
          </div>

          {/* Dependencies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dependencies (prerequisite tasks)
            </label>
            <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              {allTasks.map((t, index) => {
                // Can't depend on itself or tasks that come after
                if (index === taskIndex || index > taskIndex) return null;

                return (
                  <label
                    key={t.id}
                    className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={dependencies.includes(index)}
                      onChange={() => toggleDependency(index)}
                      className="mr-3 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-900">
                      {index + 1}. {t.name}
                    </span>
                  </label>
                );
              })}
              {allTasks.filter((t, i) => i < taskIndex).length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No available prerequisite tasks
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
