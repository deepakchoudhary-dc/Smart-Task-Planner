import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, Target, AlertCircle, 
  Edit, Save, X, MessageSquare, Sparkles, Download,
  CheckCircle, Circle, Trash2
} from 'lucide-react';
import { apiClient, Plan, Task, PlanInsights } from '@/lib/api';
import GanttChart from '@/components/GanttChart';
import TaskEditor from '@/components/TaskEditor';
import FeedbackModal from '@/components/FeedbackModal';

export default function PlanDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [processingNL, setProcessingNL] = useState(false);
  const [insights, setInsights] = useState<PlanInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const loadInsights = useCallback(async (planId: number) => {
    try {
      setInsightsLoading(true);
      const data = await apiClient.getPlanInsights(planId);
      setInsights(data);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const loadPlan = useCallback(async () => {
    try {
      setLoading(true);
      setInsights(null);
      const planData = await apiClient.getPlan(Number(id));
      setPlan(planData);
      setError(null);
      await loadInsights(planData.id);
    } catch (err: any) {
      console.error('Failed to load plan:', err);
      setError('Failed to load plan');
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [id, loadInsights]);

  useEffect(() => {
    if (id) {
      loadPlan();
    }
  }, [id, loadPlan]);

  const handleTaskUpdate = async (taskId: number, updates: Partial<Task>) => {
    if (!plan) return;

    try {
      const taskUpdates = plan.tasks.map((task, index) => {
        if (task.id === taskId) {
          return {
            name: updates.name ?? task.name,
            description: updates.description ?? task.description,
            optimistic_duration: updates.optimistic_duration ?? task.optimistic_duration,
            most_likely_duration: updates.most_likely_duration ?? task.most_likely_duration,
            pessimistic_duration: updates.pessimistic_duration ?? task.pessimistic_duration,
            dependencies: updates.dependencies ?? task.dependencies,
            is_complete: updates.is_complete ?? task.is_complete,
          };
        }
        return {
          name: task.name,
          description: task.description,
          optimistic_duration: task.optimistic_duration,
          most_likely_duration: task.most_likely_duration,
          pessimistic_duration: task.pessimistic_duration,
          dependencies: task.dependencies,
          is_complete: task.is_complete,
        };
      });

      const updatedPlan = await apiClient.updatePlan(plan.id, { tasks: taskUpdates });
      setPlan(updatedPlan);
      setEditingTask(null);
      await loadInsights(updatedPlan.id);
    } catch (err) {
      console.error('Failed to update task:', err);
      alert('Failed to update task');
    }
  };

  const handleFeedback = async (feedback: string) => {
    if (!plan) return;

    try {
      const updatedPlan = await apiClient.refinePlanWithFeedback(plan.id, { feedback });
      setPlan(updatedPlan);
      setShowFeedback(false);
      await loadInsights(updatedPlan.id);
    } catch (err) {
      console.error('Failed to refine plan:', err);
      alert('Failed to refine plan');
    }
  };

  const handleNaturalLanguageUpdate = async () => {
    if (!plan || !naturalLanguageInput.trim()) return;

    try {
      setProcessingNL(true);
      const updatedPlan = await apiClient.naturalLanguageUpdate(plan.id, {
        instruction: naturalLanguageInput.trim(),
      });
      setPlan(updatedPlan);
      setNaturalLanguageInput('');
      await loadInsights(updatedPlan.id);
    } catch (err) {
      console.error('Failed to process instruction:', err);
      alert('Failed to process instruction');
    } finally {
      setProcessingNL(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!plan) return;
    
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        await apiClient.deletePlan(plan.id);
        router.push('/');
      } catch (err) {
        console.error('Failed to delete plan:', err);
        alert('Failed to delete plan');
      }
    }
  };

  const handleExportPlan = () => {
    if (!plan) return;

    const headers = [
      'Task #',
      'Name',
      'Description',
      'Expected Duration (days)',
      'Optimistic',
      'Most Likely',
      'Pessimistic',
      'Slack (days)',
      'Start Date',
      'End Date',
      'Dependencies',
      'Critical Path',
      'Completed',
    ];

    const escape = (value: string | number | boolean | undefined) => {
      const stringValue = value === undefined || value === null ? '' : String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const rows = plan.tasks.map((task, index) => [
      index + 1,
      task.name,
      task.description || '',
      task.expected_duration.toFixed(2),
      task.optimistic_duration.toFixed(2),
      task.most_likely_duration.toFixed(2),
      task.pessimistic_duration.toFixed(2),
      task.slack.toFixed(2),
      task.start_date ? new Date(task.start_date).toLocaleDateString() : '',
      task.end_date ? new Date(task.end_date).toLocaleDateString() : '',
      task.dependencies.length ? task.dependencies.map((d) => d + 1).join(' | ') : '',
      task.is_on_critical_path ? 'Yes' : 'No',
      task.is_complete ? 'Yes' : 'No',
    ].map(escape).join(','));

    const csvContent = [headers.map(escape).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plan-${plan.id}-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const criticalPathTasks = plan?.tasks.filter(t => t.is_on_critical_path) || [];
  const completedTasks = plan?.tasks.filter(t => t.is_complete).length || 0;
  const totalTasks = plan?.tasks.length || 0;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Plan Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The plan you’re looking for doesn’t exist.'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportPlan}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              
              <button
                onClick={() => setShowFeedback(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Refine Plan</span>
              </button>
              
              <button
                onClick={handleDeletePlan}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Plan Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{plan.goal}</h1>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-600 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{plan.total_duration.toFixed(1)}</p>
              <p className="text-xs text-blue-600">days</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-green-600 mb-1">
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium">Tasks</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{totalTasks}</p>
              <p className="text-xs text-green-600">{completedTasks} completed</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-red-600 mb-1">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Critical Path</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{criticalPathTasks.length}</p>
              <p className="text-xs text-red-600">tasks</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-purple-600 mb-1">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Progress</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{progressPercentage.toFixed(0)}%</p>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-orange-600 mb-1">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Risk</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {insights?.overall_risk ?? (insightsLoading ? '...' : 'Pending')}
              </p>
              <p className="text-xs text-orange-600">
                {insights?.deadline_status ?? 'Generating insights'}
              </p>
            </div>
          </div>
        </motion.div>

        {(insightsLoading || insights) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-r from-blue-50 via-white to-purple-50 border border-blue-100 rounded-2xl shadow-inner p-8 mb-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Insights &amp; Recommendations</h2>
                <p className="text-sm text-gray-600">
                  Actionable analytics powered by slack analysis, critical path and deadline health.
                </p>
              </div>
              {insights && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-gray-600 border border-gray-200">
                  {insights.progress_percentage.toFixed(0)}% progress
                </span>
              )}
            </div>

            {insightsLoading && !insights ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-white/70 rounded"></div>
                <div className="h-4 bg-white/70 rounded"></div>
                <div className="h-4 bg-white/50 rounded"></div>
              </div>
            ) : insights ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-blue-600 mb-2">Deadline Outlook</h3>
                    <p className="text-lg font-semibold text-gray-900 mb-2">{insights.deadline_status}</p>
                    <p className="text-sm text-gray-600 mb-3">{insights.deadline_message}</p>
                    {typeof insights.buffer_days === 'number' && (
                      <div className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 inline-flex">
                        Buffer: {insights.buffer_days >= 0 ? '+' : ''}{insights.buffer_days.toFixed(1)} days
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-purple-100 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-purple-600 mb-2">Schedule Health</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>Average slack: <span className="font-semibold text-gray-900">{insights.average_slack.toFixed(1)} days</span></li>
                      <li>Zero-slack tasks: <span className="font-semibold text-gray-900">{insights.zero_slack_tasks}</span></li>
                      <li>Critical path: <span className="font-semibold text-gray-900">{insights.critical_path.join(' → ') || 'n/a'}</span></li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl border border-green-100 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-green-600 mb-2">Recommended Next Steps</h3>
                    <ul className="list-disc space-y-2 text-sm text-gray-600 pl-4">
                      {insights.recommendations.slice(0, 4).map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {insights.high_risk_tasks.length > 0 && (
                  <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>High-Risk Tasks</span>
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {insights.high_risk_tasks.map((task) => (
                        <div key={task.id} className="border border-red-100 rounded-lg px-4 py-3 bg-red-50/60">
                          <p className="font-semibold text-red-700 mb-1">{task.name}</p>
                          <p className="text-xs text-red-600 mb-1">Slack {task.slack.toFixed(2)} days • Impact: {task.impact}</p>
                          <p className="text-xs text-gray-600">Expected duration: {task.expected_duration.toFixed(1)} days</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Natural Language Update */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8 border border-purple-200"
        >
          <div className="flex items-start space-x-3">
            <Sparkles className="w-6 h-6 text-purple-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Natural Language Updates</h3>
              <p className="text-sm text-gray-600 mb-3">
                Type instructions like “add a testing phase after development” or “shorten deployment by 2 days”
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  placeholder="e.g., add a review phase between testing and deployment"
                  className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={processingNL}
                  onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageUpdate()}
                />
                <button
                  onClick={handleNaturalLanguageUpdate}
                  disabled={processingNL || !naturalLanguageInput.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {processingNL ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Apply</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gantt Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold mb-6">Project Timeline</h2>
          <GanttChart tasks={plan.tasks} />
        </motion.div>

        {/* Task List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold mb-6">Tasks</h2>
          
          <div className="space-y-3">
            {plan.tasks.map((task, index) => (
              <div
                key={task.id}
                className={`border rounded-lg p-4 transition-all ${
                  task.is_on_critical_path
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() => handleTaskUpdate(task.id, { is_complete: !task.is_complete })}
                      className="mt-1"
                    >
                      {task.is_complete ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-semibold ${task.is_complete ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {index + 1}. {task.name}
                        </h3>
                        {task.is_on_critical_path && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                            Critical
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>Duration: {task.expected_duration.toFixed(1)} days</span>
                        <span>Slack: {task.slack.toFixed(1)} days</span>
                        {task.start_date && (
                          <span>Start: {new Date(task.start_date).toLocaleDateString()}</span>
                        )}
                        {task.end_date && (
                          <span>End: {new Date(task.end_date).toLocaleDateString()}</span>
                        )}
                        {task.dependencies.length > 0 && (
                          <span>Depends on: {task.dependencies.map(d => d + 1).join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Task Editor Modal */}
      {editingTask && (
        <TaskEditor
          task={editingTask}
          allTasks={plan.tasks}
          onSave={(updates) => handleTaskUpdate(editingTask.id, updates)}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <FeedbackModal
          onSubmit={handleFeedback}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
