import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MessageSquare, Settings, FileText, Workflow, Bot, Megaphone } from 'lucide-react';
import SMSChats from './SMSChats';
import Channels from './Channels';
import Templates from './Templates';
import WorkflowBuilder from './WorkflowBuilder';
import AIHub from './AIHub';
import Campaigns from './Campaign';

const Inbox: React.FC = () => {
  const location = useLocation();

  // If we're at the base route, show the overview
  if (location.pathname === '/inbox') {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unified Inbox</h1>
          <p className="text-gray-600">Manage all your communications in one place</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open Conversations</p>
                <p className="text-2xl font-semibold text-gray-900">24</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Channels</p>
                <p className="text-2xl font-semibold text-gray-900">6</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-2xl font-semibold text-gray-900">18</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/inbox/sms-chats'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">SMS/Chats</h3>
            </div>
            <p className="text-gray-600 text-sm">Manage SMS messages and chat conversations from all channels in one unified interface.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/inbox/channels'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Channels</h3>
            </div>
            <p className="text-gray-600 text-sm">Configure and manage communication channels including SMS, email, chat, and social media.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/inbox/templates'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Templates</h3>
            </div>
            <p className="text-gray-600 text-sm">Create and manage message templates with variables for personalized communications.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/inbox/workflow-builder'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Workflow className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Workflow Builder</h3>
            </div>
            <p className="text-gray-600 text-sm">Design automated message workflows with triggers, conditions, and actions.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/inbox/ai-hub'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">AI Hub</h3>
            </div>
            <p className="text-gray-600 text-sm">AI-powered messaging features including smart replies, sentiment analysis, and automation.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/inbox/campaigns'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Campaigns</h3>
            </div>
            <p className="text-gray-600 text-sm">Create and manage marketing campaigns with targeted messaging and analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="sms-chats" element={<SMSChats />} />
      <Route path="channels" element={<Channels />} />
      <Route path="templates" element={<Templates />} />
      <Route path="workflow-builder" element={<WorkflowBuilder />} />
      <Route path="ai-hub" element={<AIHub />} />
      <Route path="campaigns" element={<Campaigns />} />
      <Route path="*" element={<Navigate to="/inbox" replace />} />
    </Routes>
  );
};

export default Inbox;