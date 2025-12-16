import React, { useState } from 'react';
import { 
  TestTube, 
  Phone, 
  Voicemail, 
  Clock, 
  Bell,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play
} from 'lucide-react';

interface ConfigurationTest {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
}

interface ConfigurationTesterProps {
  phoneNumber: string;
  onTestComplete?: (results: ConfigurationTest[]) => void;
}

const ConfigurationTester: React.FC<ConfigurationTesterProps> = ({ 
  phoneNumber, 
  onTestComplete 
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [tests, setTests] = useState<ConfigurationTest[]>([
    {
      id: 'call-forwarding',
      name: 'Call Forwarding',
      description: 'Test call forwarding to primary destination',
      icon: Phone,
      status: 'pending'
    },
    {
      id: 'voicemail',
      name: 'Voicemail',
      description: 'Test voicemail greeting and recording',
      icon: Voicemail,
      status: 'pending'
    },
    {
      id: 'business-hours',
      name: 'Business Hours',
      description: 'Verify business hours configuration',
      icon: Clock,
      status: 'pending'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Test notification delivery methods',
      icon: Bell,
      status: 'pending'
    }
  ]);

  const runTests = async () => {
    setIsRunning(true);
    
    // Reset all tests to pending
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })));

    // Run each test sequentially
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      // Set current test to running
      setTests(prev => prev.map((t, index) => 
        index === i ? { ...t, status: 'running' as const } : t
      ));

      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate test results (mock)
      const success = Math.random() > 0.2; // 80% success rate
      const status = success ? 'passed' : 'failed';
      const message = success 
        ? `${test.name} is working correctly`
        : `${test.name} configuration needs attention`;

      setTests(prev => prev.map((t, index) => 
        index === i ? { ...t, status: status as const, message } : t
      ));
    }

    setIsRunning(false);
    
    // Call completion callback
    if (onTestComplete) {
      onTestComplete(tests);
    }
  };

  const getStatusIcon = (status: ConfigurationTest['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: ConfigurationTest['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'passed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="card-title">Configuration Testing</h3>
            <p className="card-subtitle">
              Test your number configuration to ensure everything works correctly
            </p>
          </div>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="btn-primary"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {tests.map((test) => {
          const Icon = test.icon;
          return (
            <div
              key={test.id}
              className={`p-4 border rounded-lg transition-colors ${getStatusColor(test.status)}`}
            >
              <div className="flex items-start space-x-3">
                <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-charcoal">{test.name}</h4>
                    {getStatusIcon(test.status)}
                  </div>
                  <p className="text-sm text-slate mt-1">{test.description}</p>
                  {test.message && (
                    <p className={`text-sm mt-2 ${
                      test.status === 'passed' ? 'text-green-700' : 
                      test.status === 'failed' ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      {test.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Test Summary */}
      {tests.some(test => test.status !== 'pending') && !isRunning && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-charcoal">Test Results:</span>
            <div className="flex items-center space-x-4">
              <span className="text-green-600">
                {tests.filter(t => t.status === 'passed').length} Passed
              </span>
              <span className="text-red-600">
                {tests.filter(t => t.status === 'failed').length} Failed
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationTester;