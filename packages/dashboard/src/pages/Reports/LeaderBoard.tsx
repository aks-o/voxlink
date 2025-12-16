import React, { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, Trophy, Medal, Award, Star, TrendingUp, Phone, Clock, Target } from 'lucide-react';
import { AgentPerformance } from '../../../shared/src/types/call-records';

interface LeaderBoardData {
  period: {
    startDate: Date;
    endDate: Date;
  };
  agents: AgentPerformance[];
  categories: {
    totalCalls: AgentPerformance[];
    efficiency: AgentPerformance[];
    customerSatisfaction: AgentPerformance[];
    firstCallResolution: AgentPerformance[];
    averageCallDuration: AgentPerformance[];
  };
  achievements: {
    agentId: string;
    agentName: string;
    badges: string[];
    points: number;
    level: string;
  }[];
}

const LeaderBoard: React.FC = () => {
  const [reportData, setReportData] = useState<LeaderBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'totalCalls' | 'efficiency' | 'customerSatisfaction' | 'firstCallResolution'>('overall');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockAgents: AgentPerformance[] = [
        {
          agentId: '1',
          agentName: 'Sarah Johnson',
          totalCalls: 345,
          answeredCalls: 298,
          averageCallDuration: 205,
          averageWrapUpTime: 45,
          customerSatisfactionScore: 4.6,
          firstCallResolutionRate: 78.5,
          transferRate: 12.3,
          onlineTime: 28800,
          availableTime: 25200,
          busyTime: 21600,
          breakTime: 3600,
          efficiency: 87.5,
          ranking: 1
        },
        {
          agentId: '2',
          agentName: 'Lisa Rodriguez',
          totalCalls: 298,
          answeredCalls: 276,
          averageCallDuration: 212,
          averageWrapUpTime: 35,
          customerSatisfactionScore: 4.7,
          firstCallResolutionRate: 83.6,
          transferRate: 8.9,
          onlineTime: 28800,
          availableTime: 25920,
          busyTime: 23400,
          breakTime: 2880,
          efficiency: 91.2,
          ranking: 2
        },
        {
          agentId: '3',
          agentName: 'Emily Davis',
          totalCalls: 289,
          answeredCalls: 251,
          averageCallDuration: 198,
          averageWrapUpTime: 38,
          customerSatisfactionScore: 4.8,
          firstCallResolutionRate: 81.2,
          transferRate: 9.8,
          onlineTime: 28800,
          availableTime: 26100,
          busyTime: 22500,
          breakTime: 2700,
          efficiency: 89.7,
          ranking: 3
        },
        {
          agentId: '4',
          agentName: 'Mike Chen',
          totalCalls: 312,
          answeredCalls: 267,
          averageCallDuration: 189,
          averageWrapUpTime: 52,
          customerSatisfactionScore: 4.3,
          firstCallResolutionRate: 72.1,
          transferRate: 15.7,
          onlineTime: 28800,
          availableTime: 24300,
          busyTime: 19800,
          breakTime: 4500,
          efficiency: 82.3,
          ranking: 4
        },
        {
          agentId: '5',
          agentName: 'David Wilson',
          totalCalls: 267,
          answeredCalls: 234,
          averageCallDuration: 176,
          averageWrapUpTime: 41,
          customerSatisfactionScore: 4.2,
          firstCallResolutionRate: 69.8,
          transferRate: 18.2,
          onlineTime: 28800,
          availableTime: 23400,
          busyTime: 18900,
          breakTime: 5400,
          efficiency: 79.1,
          ranking: 5
        },
        {
          agentId: '6',
          agentName: 'James Thompson',
          totalCalls: 234,
          answeredCalls: 198,
          averageCallDuration: 167,
          averageWrapUpTime: 48,
          customerSatisfactionScore: 4.1,
          firstCallResolutionRate: 65.4,
          transferRate: 21.3,
          onlineTime: 28800,
          availableTime: 22680,
          busyTime: 17280,
          breakTime: 6120,
          efficiency: 74.8,
          ranking: 6
        }
      ];

      const mockData: LeaderBoardData = {
        period: {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate)
        },
        agents: mockAgents,
        categories: {
          totalCalls: [...mockAgents].sort((a, b) => b.totalCalls - a.totalCalls),
          efficiency: [...mockAgents].sort((a, b) => b.efficiency - a.efficiency),
          customerSatisfaction: [...mockAgents].sort((a, b) => b.customerSatisfactionScore - a.customerSatisfactionScore),
          firstCallResolution: [...mockAgents].sort((a, b) => b.firstCallResolutionRate - a.firstCallResolutionRate),
          averageCallDuration: [...mockAgents].sort((a, b) => a.averageCallDuration - b.averageCallDuration)
        },
        achievements: [
          {
            agentId: '1',
            agentName: 'Sarah Johnson',
            badges: ['Top Performer', 'Call Champion', 'Efficiency Expert'],
            points: 2450,
            level: 'Gold'
          },
          {
            agentId: '2',
            agentName: 'Lisa Rodriguez',
            badges: ['Customer Hero', 'Resolution Master', 'Quality Star'],
            points: 2380,
            level: 'Gold'
          },
          {
            agentId: '3',
            agentName: 'Emily Davis',
            badges: ['CSAT Champion', 'Problem Solver', 'Team Player'],
            points: 2290,
            level: 'Silver'
          },
          {
            agentId: '4',
            agentName: 'Mike Chen',
            badges: ['Consistent Performer', 'Reliable Agent'],
            points: 1980,
            level: 'Silver'
          },
          {
            agentId: '5',
            agentName: 'David Wilson',
            badges: ['Rising Star', 'Improvement Champion'],
            points: 1750,
            level: 'Bronze'
          },
          {
            agentId: '6',
            agentName: 'James Thompson',
            badges: ['Team Member'],
            points: 1520,
            level: 'Bronze'
          }
        ]
      };
      
      setReportData(mockData);
    } catch (error) {
      console.error('Failed to fetch leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting leaderboard as ${format}`);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-500" />;
      default: return <Star className="w-6 h-6 text-gray-300" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-600';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Gold': return 'bg-yellow-100 text-yellow-800';
      case 'Silver': return 'bg-gray-100 text-gray-800';
      case 'Bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getCurrentRanking = () => {
    switch (selectedCategory) {
      case 'totalCalls': return reportData?.categories.totalCalls || [];
      case 'efficiency': return reportData?.categories.efficiency || [];
      case 'customerSatisfaction': return reportData?.categories.customerSatisfaction || [];
      case 'firstCallResolution': return reportData?.categories.firstCallResolution || [];
      default: return reportData?.agents || [];
    }
  };

  const getMetricValue = (agent: AgentPerformance, category: string) => {
    switch (category) {
      case 'totalCalls': return agent.totalCalls.toString();
      case 'efficiency': return `${agent.efficiency.toFixed(1)}%`;
      case 'customerSatisfaction': return agent.customerSatisfactionScore.toFixed(1);
      case 'firstCallResolution': return `${agent.firstCallResolutionRate.toFixed(1)}%`;
      default: return `${agent.efficiency.toFixed(1)}%`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-voxlink-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Leaderboard</h1>
          <p className="text-gray-600 mt-1">Recognize top performers and track agent achievements</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchReportData}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-gray-400" />
            <select
              onChange={(e) => handleExport(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
              defaultValue=""
            >
              <option value="" disabled>Export</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="overall">Overall Performance</option>
              <option value="totalCalls">Total Calls</option>
              <option value="efficiency">Efficiency</option>
              <option value="customerSatisfaction">Customer Satisfaction</option>
              <option value="firstCallResolution">First Call Resolution</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performers</h3>
        <div className="flex justify-center items-end space-x-8">
          {getCurrentRanking().slice(0, 3).map((agent, index) => {
            const rank = index + 1;
            const achievement = reportData?.achievements.find(a => a.agentId === agent.agentId);
            
            return (
              <div key={agent.agentId} className={`text-center ${rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'}`}>
                <div className={`relative ${rank === 1 ? 'h-32' : rank === 2 ? 'h-24' : 'h-20'} w-20 ${getRankColor(rank)} rounded-t-lg flex items-end justify-center pb-4 mb-4`}>
                  <div className="text-white font-bold text-2xl">{rank}</div>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    {getRankIcon(rank)}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">{agent.agentName}</h4>
                  <div className="text-2xl font-bold text-voxlink-blue">
                    {getMetricValue(agent, selectedCategory)}
                  </div>
                  {achievement && (
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(achievement.level)}`}>
                        {achievement.level} Level
                      </span>
                      <div className="text-sm text-gray-600">{achievement.points} pts</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Rankings</h3>
        <div className="space-y-3">
          {getCurrentRanking().map((agent, index) => {
            const rank = index + 1;
            const achievement = reportData?.achievements.find(a => a.agentId === agent.agentId);
            
            return (
              <div key={agent.agentId} className={`flex items-center justify-between p-4 rounded-lg border ${
                rank <= 3 ? 'border-voxlink-blue bg-blue-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-semibold text-gray-700">
                    {rank}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{agent.agentName}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Phone className="w-3 h-3" />
                        <span>{agent.totalCalls} calls</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>{Math.round(agent.averageCallDuration)}s avg</span>
                        <Target className="w-3 h-3 ml-2" />
                        <span>{agent.firstCallResolutionRate.toFixed(1)}% FCR</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {getMetricValue(agent, selectedCategory)}
                    </div>
                    <div className="text-sm text-gray-500">
                      CSAT: {agent.customerSatisfactionScore.toFixed(1)}
                    </div>
                  </div>
                  
                  {achievement && (
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(achievement.level)}`}>
                        {achievement.level}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">{achievement.points} pts</div>
                    </div>
                  )}
                  
                  {rank <= 3 && (
                    <div className="ml-2">
                      {getRankIcon(rank)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements & Badges */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportData?.achievements.map((achievement) => (
            <div key={achievement.agentId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{achievement.agentName}</h4>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(achievement.level)}`}>
                  {achievement.level} Level
                </span>
              </div>
              
              <div className="mb-3">
                <div className="text-2xl font-bold text-voxlink-blue mb-1">{achievement.points}</div>
                <div className="text-sm text-gray-500">Total Points</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Badges Earned:</div>
                <div className="flex flex-wrap gap-1">
                  {achievement.badges.map((badge, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderBoard;