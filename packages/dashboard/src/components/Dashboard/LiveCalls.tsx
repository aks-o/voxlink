import React, { useEffect, useState } from 'react';
import { Phone, Clock } from 'lucide-react';
import { useCallEvents, useLiveMetrics } from '../../hooks/useRealtime';

interface Call {
  id: number;
  agent: string;
  number: string;
  duration: number;
  status: string;
}

interface LiveCallsProps {
  calls?: Call[];
}

const LiveCalls: React.FC<LiveCallsProps> = ({ calls = [] }) => {
  const { activeCalls } = useCallEvents();
  const { metrics, subscribe, unsubscribe, isSubscribed } = useLiveMetrics();
  const [callDurations, setCallDurations] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  // Update call durations every second for active calls
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDurations(prev => {
        const newDurations = new Map(prev);
        activeCalls.forEach(call => {
          if (call.type === 'answered') {
            const currentDuration = newDurations.get(call.callId) || 0;
            newDurations.set(call.callId, currentDuration + 1);
          }
        });
        return newDurations;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCalls]);

  // Initialize call durations when new calls come in
  useEffect(() => {
    activeCalls.forEach(call => {
      if (!callDurations.has(call.callId)) {
        setCallDurations(prev => new Map(prev.set(call.callId, 0)));
      }
    });
  }, [activeCalls, callDurations]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'incoming': return 'text-yellow-600';
      case 'answered': return 'text-success-green';
      case 'ended': return 'text-gray-500';
      case 'transferred': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'incoming': return 'INCOMING';
      case 'answered': return 'LIVE';
      case 'ended': return 'ENDED';
      case 'transferred': return 'TRANSFERRED';
      default: return 'UNKNOWN';
    }
  };

  // Convert real-time calls to display format
  const realtimeCalls = activeCalls.map(call => ({
    id: call.callId.hashCode ? call.callId.hashCode() : Math.random(),
    agent: call.agentId || 'Unassigned',
    number: call.metadata?.fromNumber || 'Unknown',
    duration: callDurations.get(call.callId) || 0,
    status: call.type
  }));

  // Use real-time calls if available, otherwise fall back to props or default
  const defaultCalls = [
    {
      id: 1,
      agent: 'John Smith',
      number: '+1 (555) 123-4567',
      duration: 125,
      status: 'answered',
    },
    {
      id: 2,
      agent: 'Sarah Johnson',
      number: '+1 (555) 987-6543',
      duration: 67,
      status: 'answered',
    },
  ];

  const displayCalls = realtimeCalls.length > 0 ? realtimeCalls : (calls.length > 0 ? calls : defaultCalls);

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="card-title">Live Calls</h3>
            <p className="card-subtitle">Currently active calls</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-success-green' : 'bg-red-400'}`}></div>
            <span className="text-sm text-success-green font-medium">
              {displayCalls.length} Active
            </span>
            {metrics && (
              <span className="text-xs text-slate">
                (Queue: {metrics.queuedCalls})
              </span>
            )}
          </div>
        </div>
      </div>
      
      {displayCalls.length > 0 ? (
        <div className="space-y-4">
          {displayCalls.map((call) => (
            <div key={call.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-voxlink-blue" />
                  <span className="text-sm font-medium text-charcoal">
                    {call.agent}
                  </span>
                </div>
                <div className={`flex items-center space-x-1 ${getStatusColor(call.status)}`}>
                  <div className={`w-2 h-2 rounded-full ${call.status === 'answered' ? 'bg-success-green animate-pulse' : 'bg-current'}`}></div>
                  <span className="text-xs font-medium">{getStatusText(call.status)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate phone-number">
                  {call.number}
                </p>
                <div className="flex items-center space-x-1 text-xs text-slate">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(call.duration)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate">
          <Phone className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No active calls</p>
          {!isSubscribed && (
            <p className="text-xs text-red-500 mt-1">Real-time connection offline</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveCalls;