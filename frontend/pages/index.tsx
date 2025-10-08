import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Target, Sparkles, Calendar, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { apiClient, PlanSummary } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentPlans, setRecentPlans] = useState<PlanSummary[]>([]);
  const [ollamaHealthy, setOllamaHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    loadRecentPlans();
    checkOllamaHealth();
  }, []);

  const checkOllamaHealth = async () => {
    try {
      const health = await apiClient.checkOllamaHealth();
      setOllamaHealthy(health.status === 'healthy' && health.qwen_installed);
    } catch (err) {
      setOllamaHealthy(false);
    }
  };

  const loadRecentPlans = async () => {
    try {
      const plans = await apiClient.listPlans();
      setRecentPlans(plans.slice(0, 5));
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goal.trim()) {
      setError('Please enter a goal');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const plan = await apiClient.createPlan({
        goal: goal.trim(),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });

      router.push(`/plan/${plan.id}`);
    } catch (err: any) {
      console.error('Failed to create plan:', err);
      setError(err.response?.data?.detail || 'Failed to create plan. Please check if Ollama is running.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                Smart Task Planner
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {ollamaHealthy === false && (
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">
                  ⚠️ Ollama not detected
                </span>
              )}
              {ollamaHealthy === true && (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  ✓ AI Ready
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-4"
            >
              <div className="bg-gradient-to-r from-primary-500 to-purple-500 p-4 rounded-2xl shadow-lg">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary-900 to-purple-900 bg-clip-text text-transparent">
              Turn Your Goals Into Action
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              AI-powered project planning with CPM/PERT scheduling. 
              Break down complex goals into actionable tasks with smart dependencies and timelines.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
            >
              <TrendingUp className="w-10 h-10 text-primary-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Critical Path Analysis</h3>
              <p className="text-sm text-gray-600">Automatically identifies bottlenecks and critical tasks</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
            >
              <Clock className="w-10 h-10 text-purple-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">PERT Estimation</h3>
              <p className="text-sm text-gray-600">Three-point estimates for realistic scheduling</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
            >
              <Sparkles className="w-10 h-10 text-pink-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-600">Local LLM generates tasks from natural language</p>
            </motion.div>
          </div>

          {/* Create Plan Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-12"
          >
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                  What’s your goal? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Launch a new mobile app in 3 months, Organize a company event for 200 people, Complete a house renovation project..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={4}
                  disabled={loading}
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Optional Deadline
                </label>
                <input
                  type="date"
                  id="deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || !goal.trim()}
                className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-primary-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating your plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Smart Plan</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Recent Plans */}
          {recentPlans.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-2xl font-bold mb-6">Recent Plans</h3>
              <div className="space-y-4">
                {recentPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => router.push(`/plan/${plan.id}`)}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg cursor-pointer border border-gray-100 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2 text-gray-900">{plan.goal}</h4>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {plan.total_duration.toFixed(1)} days
                          </span>
                          <span className="flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {plan.task_count} tasks
                          </span>
                          <span>
                            Created {new Date(plan.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-8 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="mb-2">Smart Task Planner • Built with Next.js, FastAPI & Qwen3</p>
          <p className="text-sm">Powered by local AI • No data leaves your machine</p>
        </div>
      </footer>
    </div>
  );
}
