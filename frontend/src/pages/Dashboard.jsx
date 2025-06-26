import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import bugService from '../services/bugService';
import { 
  Bug, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  TrendingUp,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBugs, setRecentBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dark mode toggle
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch bug statistics
      const statsResponse = await bugService.getBugStats();
      setStats(statsResponse.data.overview);

      // Fetch recent bugs
      const bugsResponse = await bugService.getBugs({ 
        page: 1, 
        limit: 5, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      setRecentBugs(bugsResponse.data.bugs);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-error-600 bg-error-100';
      case 'high': return 'text-warning-600 bg-warning-100';
      case 'medium': return 'text-primary-600 bg-primary-100';
      case 'low': return 'text-success-600 bg-success-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-error-600 bg-error-100';
      case 'in_progress': return 'text-warning-600 bg-warning-100';
      case 'resolved': return 'text-success-600 bg-success-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dark mode toggle button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="btn btn-outline"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your bugs today.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary-100">
                  <Bug className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Bugs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalBugs || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-error-100">
                  <AlertTriangle className="h-6 w-6 text-error-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Open Bugs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.openBugs || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-warning-100">
                  <Clock className="h-6 w-6 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.inProgressBugs || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-success-100">
                  <CheckCircle className="h-6 w-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.resolvedBugs || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="card-body space-y-4">
                <a
                  href="/bugs/new"
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 rounded bg-primary-100">
                    <Bug className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Report New Bug</p>
                    <p className="text-sm text-gray-500">Create a new bug report</p>
                  </div>
                </a>

                <a
                  href="/bugs?status=open"
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 rounded bg-warning-100">
                    <AlertTriangle className="h-5 w-5 text-warning-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">View Open Bugs</p>
                    <p className="text-sm text-gray-500">See all unresolved issues</p>
                  </div>
                </a>

                <a
                  href="/reports"
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 rounded bg-success-100">
                    <TrendingUp className="h-5 w-5 text-success-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">View Reports</p>
                    <p className="text-sm text-gray-500">Analyze bug trends</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Recent Bugs</h3>
              </div>
              <div className="card-body">
                {recentBugs.length === 0 ? (
                  <div className="text-center py-8">
                    <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No bugs reported yet.</p>
                    <a
                      href="/bugs/new"
                      className="mt-2 btn-primary inline-flex items-center"
                    >
                      Report Your First Bug
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentBugs.map((bug) => (
                      <div
                        key={bug._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {bug.title}
                            </h4>
                            <span
                              className={`badge ${getSeverityColor(bug.severity)}`}
                            >
                              {bug.severity}
                            </span>
                            <span
                              className={`badge ${getStatusColor(bug.status)}`}
                            >
                              {bug.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span>#{bug._id.slice(-6)}</span>
                            <span>{bug.project}</span>
                            <span>
                              by {bug.reportedBy?.firstName} {bug.reportedBy?.lastName}
                            </span>
                            <span>
                              {new Date(bug.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <a
                            href={`/bugs/${bug._id}`}
                            className="btn-outline text-sm"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-4">
                      <a
                        href="/bugs"
                        className="text-primary-600 hover:text-primary-500 font-medium"
                      >
                        View all bugs →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Priority Alerts */}
        {stats?.criticalBugs > 0 && (
          <div className="mt-8">
            <div className="bg-error-50 border border-error-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-error-600 mr-2" />
                <div>
                  <h4 className="font-medium text-error-800">
                    Critical Issues Need Attention
                  </h4>
                  <p className="text-error-700">
                    You have {stats.criticalBugs} critical bug{stats.criticalBugs > 1 ? 's' : ''} that need immediate attention.
                  </p>
                </div>
                <div className="ml-auto">
                  <a
                    href="/bugs?severity=critical"
                    className="btn-error"
                  >
                    View Critical Bugs
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
