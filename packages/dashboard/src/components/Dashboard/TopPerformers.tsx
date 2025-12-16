import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';

const TopPerformers: React.FC = () => {
  const performers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      calls: 156,
      duration: '12h 34m',
      successRate: 94.2,
      avatar: 'SJ',
    },
    {
      id: 2,
      name: 'Mike Chen',
      calls: 142,
      duration: '11h 28m',
      successRate: 91.8,
      avatar: 'MC',
    },
    {
      id: 3,
      name: 'Emily Davis',
      calls: 138,
      duration: '10h 56m',
      successRate: 89.5,
      avatar: 'ED',
    },
    {
      id: 4,
      name: 'John Smith',
      calls: 125,
      duration: '9h 42m',
      successRate: 87.3,
      avatar: 'JS',
    },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Top Performers</h3>
        <p className="card-subtitle">Best agents this week</p>
      </div>
      
      <div className="space-y-4">
        {performers.map((performer, index) => (
          <div key={performer.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-10 h-10 bg-voxlink-blue rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {performer.avatar}
                </div>
                {index === 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning-amber rounded-full flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-charcoal truncate">
                  {performer.name}
                </p>
                <div className="flex items-center text-xs text-success-green">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {performer.successRate}%
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate">
                  {performer.calls} calls • {performer.duration}
                </p>
                <div className="text-xs text-slate">
                  #{index + 1}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-voxlink-blue hover:text-blue-700 font-medium">
          View all performers
        </button>
      </div>
    </div>
  );
};

export default TopPerformers;