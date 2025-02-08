import React, { useState, useEffect } from 'react';
import {
  Brain,
  Clock,
  Instagram,
  Youtube,
  Search,
  Users,
  TrendingUp,
  Activity,
  PlaySquare,
  MousePointerClick,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from './lib/supabase';
import { updateSocialMetrics } from './lib/socialApis';

// Utility function to format numbers (e.g., 1000 -> 1K)
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Process engagement data for the chart
function processEngagementData(data: any[]) {
  return data.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleDateString(),
    engagement: item.engagement_count,
    platform: item.platform
  }));
}

function App() {
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [socialMetrics, setSocialMetrics] = useState({
    instagram: { followers: '0', engagement: '0%', recentPosts: 0, growth: '0%' },
    youtube: { subscribers: '0', avgViews: '0', totalVideos: 0, growth: '0%' },
    google: { searchImpressions: '0', clickRate: '0%', avgPosition: '0', growth: '0%' }
  });
  const [engagementData, setEngagementData] = useState([]);
  const [customerSegments, setCustomerSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch platform metrics
      const { data: metricsData } = await supabase
        .from('platform_metrics')
        .select('*');

      if (metricsData) {
        const metrics = {
          instagram: {
            followers: formatNumber(metricsData.find(m => m.platform === 'instagram')?.followers || 0),
            engagement: `${metricsData.find(m => m.platform === 'instagram')?.engagement_rate || 0}%`,
            recentPosts: metricsData.find(m => m.platform === 'instagram')?.total_posts || 0,
            growth: `+${metricsData.find(m => m.platform === 'instagram')?.growth_rate || 0}%`
          },
          youtube: {
            subscribers: formatNumber(metricsData.find(m => m.platform === 'youtube')?.followers || 0),
            avgViews: formatNumber(metricsData.find(m => m.platform === 'youtube')?.avg_views || 0),
            totalVideos: metricsData.find(m => m.platform === 'youtube')?.total_posts || 0,
            growth: `+${metricsData.find(m => m.platform === 'youtube')?.growth_rate || 0}%`
          },
          google: {
            searchImpressions: formatNumber(metricsData.find(m => m.platform === 'google')?.search_impressions || 0),
            clickRate: `${metricsData.find(m => m.platform === 'google')?.click_rate || 0}%`,
            avgPosition: metricsData.find(m => m.platform === 'google')?.avg_position?.toFixed(1) || '0',
            growth: `+${metricsData.find(m => m.platform === 'google')?.growth_rate || 0}%`
          }
        };
        setSocialMetrics(metrics);
      }

      // Fetch engagement data
      const { data: engagementResult } = await supabase
        .from('engagement_data')
        .select('*')
        .order('timestamp', { ascending: true });

      if (engagementResult) {
        const processedData = processEngagementData(engagementResult);
        setEngagementData(processedData);
      }

      // Fetch demographics data
      const { data: demographicsData } = await supabase
        .from('audience_demographics')
        .select('*')
        .eq('platform', selectedPlatform);

      if (demographicsData) {
        setCustomerSegments(
          demographicsData.map(item => ({
            name: item.age_group,
            value: Number(item.percentage)
          }))
        );
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const updatePersonalAccounts = async () => {
    try {
      setUpdating(true);
      const success = await updateSocialMetrics({
        instagramToken: import.meta.env.VITE_INSTAGRAM_TOKEN,
        youtubeKey: import.meta.env.VITE_YOUTUBE_API_KEY,
        youtubeChannelId: import.meta.env.VITE_YOUTUBE_CHANNEL_ID,
        googleToken: import.meta.env.VITE_GOOGLE_TOKEN
      });
      
      if (success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating accounts:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-purple-400" />
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                SocialAI Insights
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={updatePersonalAccounts}
                disabled={updating}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-colors ${
                  updating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
                <span>{updating ? 'Updating...' : 'Update Personal Accounts'}</span>
              </button>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-400" />
                <span className="text-sm text-purple-200">Real-time Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Platform metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Instagram className="h-6 w-6 text-pink-400" />
                  <h2 className="text-xl font-semibold">Instagram</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Followers</p>
                    <p className="text-2xl font-bold">{socialMetrics.instagram.followers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Engagement Rate</p>
                    <p className="text-2xl font-bold">{socialMetrics.instagram.engagement}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400">Recent Posts</p>
                      <p className="text-xl font-bold">{socialMetrics.instagram.recentPosts}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Growth</p>
                      <p className="text-xl font-bold text-green-400">{socialMetrics.instagram.growth}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Youtube className="h-6 w-6 text-red-400" />
                  <h2 className="text-xl font-semibold">YouTube</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Subscribers</p>
                    <p className="text-2xl font-bold">{socialMetrics.youtube.subscribers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Average Views</p>
                    <p className="text-2xl font-bold">{socialMetrics.youtube.avgViews}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400">Total Videos</p>
                      <p className="text-xl font-bold">{socialMetrics.youtube.totalVideos}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Growth</p>
                      <p className="text-xl font-bold text-green-400">{socialMetrics.youtube.growth}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Search className="h-6 w-6 text-blue-400" />
                  <h2 className="text-xl font-semibold">Google Search</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Search Impressions</p>
                    <p className="text-2xl font-bold">{socialMetrics.google.searchImpressions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Click Rate</p>
                    <p className="text-2xl font-bold">{socialMetrics.google.clickRate}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400">Avg. Position</p>
                      <p className="text-xl font-bold">{socialMetrics.google.avgPosition}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Growth</p>
                      <p className="text-xl font-bold text-green-400">{socialMetrics.google.growth}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement Chart */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Engagement Over Time</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagementData}>
                    <defs>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(17, 24, 39, 0.8)',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      stroke="#8B5CF6"
                      fillOpacity={1}
                      fill="url(#colorEngagement)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demographics */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Audience Demographics</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;