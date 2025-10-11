import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Calendar, Clock, Target, 
  ChevronRight, Sparkles, Settings, User,
  Folder, FileText, BarChart3
} from 'lucide-react';
import { apiClient, Plan } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);
  const [genaiHealthy, setGenaiHealthy] = useState(false);

  useEffect(() => {
    loadPlans();
    checkGenAIHealth();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const plansData = await apiClient.listPlans();
      setPlans(plansData);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load plans:', err);
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const checkGenAIHealth = async () => {
    try {
      const health = await apiClient.checkGenAIHealth();
      setGenaiHealthy(health.status === 'healthy');
    } catch (err) {
      console.error('GenAI health check failed:', err);
      setGenaiHealthy(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || !deadline) return;

    setCreating(true);
    try {
      const newPlan = await apiClient.createPlan({
        goal: goal.trim(),
        deadline: new Date(deadline).toISOString(),
      });
      
      setGoal('');
      setDeadline('');
      await loadPlans();
      router.push(`/plan/${newPlan.id}`);
    } catch (err: any) {
      console.error('Failed to create plan:', err);
      alert('Failed to create plan. Please make sure Google GenAI is configured.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
                <span className="text-white font-medium text-sm">P</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Smart Task Planner</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                {genaiHealthy ? (
                  <span className="text-green-600">✓ AI Ready</span>
                ) : (
                  <span className="text-red-600">GenAI not configured</span>
                )}
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-600">Create intelligent project plans with AI-powered task scheduling.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Create New Plan */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Plan</h3>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                    What do you want to accomplish?
                  </label>
                  <textarea
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Launch a new mobile app, Organize a company event, Complete a house renovation..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                    rows={3}
                    disabled={creating}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                    When do you need it done?
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                    disabled={creating}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={creating || !goal.trim() || !deadline}
                  className="w-full bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create Plan</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{plans.length}</p>
                  <p className="text-xs text-gray-500">Active Plans</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {plans.reduce((sum, plan) => sum + plan.task_count, 0)}
                  </p>
                  <p className="text-xs text-gray-500">Total Tasks</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {plans.reduce((sum, plan) => sum + plan.total_duration, 0).toFixed(0)}d
                  </p>
                  <p className="text-xs text-gray-500">Total Duration</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Your Plans</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search plans..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load plans. Please try again.</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No plans yet</h4>
              <p className="text-gray-500 mb-4">Create your first plan to get started with AI-powered project management.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => router.push(`/plan/${plan.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                      {plan.goal}
                    </h4>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{plan.total_duration.toFixed(1)} days</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Target className="w-4 h-4 mr-2" />
                      <span>{plan.task_count} tasks</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/plan/${plan.id}`);
                      }}
                      className="flex-1 text-xs px-3 py-1.5 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                    >
                      View Plan
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}