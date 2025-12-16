import React, { useState, useEffect } from 'react';
import { useCallEvents, useAgentStatus, useLiveMetrics } from '../../hooks/useRealtime';

interface CallMonitoringProps {
  className?: string;
}

interface CallMonitoringCardProps {
  callId: string;
  fromNumber: string;
  toNumber: string;
  agentId?: string;
  duration: number;
  status: 'incoming' | 'answered' | 'ended' | 'transferred';
  onWhisper: (callId: string, agentId: string, message: string) => void;
  onBargeIn: (callId: string, supervisorId: string) => void;
  onJoinMonitoring: (callId: string) => void;
  onLeaveMonitoring: (callId: string) => void;
}

const CallMonitoringCard: React.FC<CallMonitoringCardProps> = ({
  callId,
  fromNumber,
  toNumber,
  agentId,
  duration,
  status,
  onWhisper,
  onBargeIn,
  onJoinMonitoring,
  onLeaveMonitoring
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [whisperMessage, setWhisperMessage] = useState('');
  const [showWhisperInput, setShowWhisperInput] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'incoming': return 'bg-yellow-100 text-yellow-800';
      case 'answered': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'transferred': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMonitoringToggle = () => {
    if (isMonitoring) {
      onLeaveMonitoring(callId);
      setIsMonitoring(false);
    } else {
      onJoinMonitoring(callId);
      setIsMonitoring(true);
    }
  };

  const handleWhisper = () => {
    if (whisperMessage.trim() && agentId) {
      onWhisper(callId, agentId, whisperMessage);
      setWhisperMessage('');
      setShowWhisperInput(false);
    }
  };

  const handleBargeIn = () => {
    const supervisorId = 'current-supervisor-id'; // This should come from auth context
    onBargeIn(callId, supervisorId);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{fromNumber}</span>
              <span className="text-gray-400">→</span>
              <span className="font-medium text-gray-900">{toNumber}</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              {agentId && (
                <span className="text-sm text-gray-500">Agent: {agentId}</span>
              )}
              <span className="text-sm text-gray-500">{formatDuration(duration)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMonitoringToggle}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isMonitoring 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Monitor'}
          </button>
          
          {status === 'answered' && agentId && (
            <>
              <button
                onClick={() => setShowWhisperInput(!showWhisperInput)}
                className="px-3 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              >
                Whisper
              </button>
              
              <button
                onClick={handleBargeIn}
                className="px-3 py-1 rounded text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200"
              >
                Barge In
              </button>
            </>
          )}
        </div>
      </div>

      {showWhisperInput && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={whisperMessage}
              onChange={(e) => setWhisperMessage(e.target.value)}
              placeholder="Enter whisper message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleWhisper()}
            />
            <button
              onClick={handleWhisper}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Send
            </button>
            <button
              onClick={() => setShowWhisperInput(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const LiveCallMonitoring: React.FC<CallMonitoringProps> = ({ className = '' }) => {
  const { activeCalls, joinCallMonitoring, leaveCallMonitoring, whisperToAgent, bargeIntoCall } = useCallEvents();
  const { metrics, subscribe, unsubscribe, isSubscribed } = useLiveMetrics();
  const [callDurations, setCallDurations] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  // Update call durations every second
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

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Live Call Monitoring</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isSubscribed ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {metrics && (
              <div className="text-sm text-gray-600">
                Active: {metrics.activeCalls} | Queue: {metrics.queuedCalls}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeCalls.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <p className="text-gray-500">No active calls to monitor</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCalls.map(call => (
              <CallMonitoringCard
                key={call.callId}
                callId={call.callId}
                fromNumber={call.metadata?.fromNumber || 'Unknown'}
                toNumber={call.metadata?.toNumber || 'Unknown'}
                agentId={call.agentId}
                duration={callDurations.get(call.callId) || 0}
                status={call.type}
                onWhisper={whisperToAgent}
                onBargeIn={bargeIntoCall}
                onJoinMonitoring={joinCallMonitoring}
                onLeaveMonitoring={leaveCallMonitoring}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCallMonitoring;