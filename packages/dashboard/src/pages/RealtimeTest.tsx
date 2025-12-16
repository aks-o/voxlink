import React, { useEffect, useState } from 'react';
import { useRealtime, useCallEvents, useLiveMetrics, useSystemNotifications } from '../hooks/useRealtime';

const RealtimeTest: React.FC = () => {
  const { isConnected, connectionStatus, latency } = useRealtime();
  const { callEvents, activeCalls } = useCallEvents();
  const { metrics, isSubscribed: metricsSubscribed } = useLiveMetrics();
  const { notifications, performanceAlerts, unreadCount } = useSystemNotifications();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    if (isConnected) {
      addTestResult('✅ WebSocket connected successfully');
    } else {
      addTestResult('❌ WebSocket disconnected');
    }
  }, [isConnected]);

  useEffect(() => {
    if (callEvents.length > 0) {
      const latestEvent = callEvents[0];
      addTestResult(`📞 Call event: ${latestEvent.type} - ${latestEvent.callId}`);
    }
  }, [callEvents]);

  useEffect(() => {
    if (metrics) {
      addTestResult(`📊 Metrics updated: ${metrics.activeCalls} active calls, ${metrics.queuedCalls} queued`);
    }
  }, [metrics]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      addTestResult(`🔔 Notification: ${latestNotification.type} - ${latestNotification.message}`);
    }
  }, [notifications]);

  useEffect(() => {
    if (performanceAlerts.length > 0) {
      const latestAlert = performanceAlerts[0];
      addTestResult(`⚠️ Performance Alert: ${latestAlert.type} - ${latestAlert.metric}`);
    }
  }, [performanceAlerts]);

  const testCallEvent = async () => {
    try {
      const response = await fetch('/websocket/test/call-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'incoming',
          callId: `test-${Date.now()}`,
          agentId: 'test-agent-1'
        })
      });
      
      if (response.ok) {
        addTestResult('✅ Test call event sent');
      } else {
        addTestResult('❌ Failed to send test call event');
      }
    } catch (error) {
      addTestResult('❌ Error sending test call event');
    }
  };

  const testNotification = async () => {
    try {
      const response = await fetch('/websocket/test/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'alert',
          severity: 'high',
          message: 'This is a test notification from the dashboard'
        })
      });
      
      if (response.ok) {
        addTestResult('✅ Test notification sent');
      } else {
        addTestResult('❌ Failed to send test notification');
      }
    } catch (error) {
      addTestResult('❌ Error sending test notification');
    }
  };

  const testPerformanceAlert = async () => {
    try {
      const response = await fetch('/websocket/test/performance-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'threshold_breach',
          metric: 'response_time',
          currentValue: 2000,
          threshold: 1000,
          affectedServices: ['dashboard', 'api-gateway']
        })
      });
      
      if (response.ok) {
        addTestResult('✅ Test performance alert sent');
      } else {
        addTestResult('❌ Failed to send test performance alert');
      }
    } catch (error) {
      addTestResult('❌ Error sending test performance alert');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Real-time Communication Test</h1>
        
        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Connection Status</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
                {connectionStatus}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Latency</h3>
            <span className="text-lg font-bold text-gray-900">
              {latency !== null ? `${latency}ms` : 'N/A'}
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Unread Notifications</h3>
            <span className="text-lg font-bold text-gray-900">{unreadCount}</span>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={testCallEvent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test Call Event
          </button>
          
          <button
            onClick={testNotification}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Test Notification
          </button>
          
          <button
            onClick={testPerformanceAlert}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Test Performance Alert
          </button>
        </div>

        {/* Current Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Calls ({activeCalls.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {activeCalls.length === 0 ? (
                <p className="text-gray-500 text-sm">No active calls</p>
              ) : (
                activeCalls.map(call => (
                  <div key={call.callId} className="text-sm bg-white rounded p-2">
                    <div className="font-medium">{call.callId}</div>
                    <div className="text-gray-600">Type: {call.type} | Agent: {call.agentId || 'Unassigned'}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Live Metrics</h3>
            {metrics ? (
              <div className="space-y-2 text-sm">
                <div>Active Calls: <span className="font-medium">{metrics.activeCalls}</span></div>
                <div>Queued Calls: <span className="font-medium">{metrics.queuedCalls}</span></div>
                <div>Available Agents: <span className="font-medium">{metrics.availableAgents}</span></div>
                <div>Busy Agents: <span className="font-medium">{metrics.busyAgents}</span></div>
                <div>Abandon Rate: <span className="font-medium">{(metrics.abandonRate * 100).toFixed(1)}%</span></div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No metrics data</p>
            )}
          </div>
        </div>

        {/* Test Results Log */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Results Log</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">No test results yet</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono bg-white rounded p-2">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeTest;