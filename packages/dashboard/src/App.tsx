import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from '@components/Layout/Layout';
import Dashboard from '@pages/Dashboard/Dashboard';
import Numbers from '@pages/Numbers/Numbers';
import Analytics from '@pages/Analytics/Analytics';
import CallLogs from '@pages/CallLogs/CallLogs';
import Inbox from '@pages/Inbox/Inbox';
import Users from '@pages/Users/Users';
import Integrations from '@pages/Integrations/Integrations';
import Settings from '@pages/Settings/Settings';
import AIVoiceAgent from '@pages/AIVoiceAgent/AIVoiceAgent';
import Dialer from '@pages/Dialer/Dialer';
import AICopilot from '@pages/AICopilot/AICopilot';
import { AuthProvider } from '@utils/auth';
import { AnalyticsProvider } from '@utils/analytics';
import { NotificationProvider } from '@utils/notifications';

function App() {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        <NotificationProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="numbers/*" element={<Numbers />} />
                <Route path="analytics/*" element={<Analytics />} />
                <Route path="call-logs" element={<CallLogs />} />
                <Route path="inbox/*" element={<Inbox />} />
                <Route path="users" element={<Users />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="ai-voice-agent/*" element={<AIVoiceAgent />} />
                <Route path="dialer/*" element={<Dialer />} />
                <Route path="ai-copilot" element={<AICopilot />} />
                <Route path="settings/*" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            
            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: {
                    primary: '#059669',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#DC2626',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </NotificationProvider>
      </AnalyticsProvider>
    </AuthProvider>
  );
}

export default App;