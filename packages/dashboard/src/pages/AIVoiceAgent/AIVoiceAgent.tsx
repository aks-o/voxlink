import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Bot, Workflow, Phone, FileText, Zap } from 'lucide-react';
import AIAgents from '../AIAgent/AIAgents';
import VoiceWorkflows from '../AIAgent/VoiceWorkflows';

const AIVoiceAgent: React.FC = () => {
  const location = useLocation();

  // If we're at the base route, show the overview
  if (location.pathname === '/ai-voice-agent') {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Voice Agent</h1>
          <p className="text-gray-600">Manage AI-powered voice agents and conversation workflows</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Workflow className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Workflows</p>
                <p className="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Calls Today</p>
                <p className="text-2xl font-semibold text-gray-900">1,247</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">87%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/ai-voice-agent/agents'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">AI Agents</h3>
            </div>
            <p className="text-gray-600 text-sm">Create and manage AI-powered voice agents with custom personalities and capabilities.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/ai-voice-agent/workflows'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Workflow className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Voice Workflows</h3>
            </div>
            <p className="text-gray-600 text-sm">Design conversation flows with conditional logic and branching for complex interactions.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/numbers'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Numbers</h3>
            </div>
            <p className="text-gray-600 text-sm">Manage virtual phone numbers and configure routing for your AI agents.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/call-logs'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Call Logs</h3>
            </div>
            <p className="text-gray-600 text-sm">Review call recordings, transcripts, and performance analytics for your AI agents.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="agents/*" element={<AIAgents />} />
      <Route path="workflows/*" element={<VoiceWorkflows />} />
      <Route path="*" element={<Navigate to="/ai-voice-agent" replace />} />
    </Routes>
  );
};

export default AIVoiceAgent;