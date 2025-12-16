import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Phone, Mail, Send, Paperclip, MoreVertical } from 'lucide-react';
import { UnifiedMessage, MessageThread } from '../../../shared/src/types/messaging';

const SMSChats: React.FC = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    // TODO: Fetch threads from API
    const mockThreads: MessageThread[] = [
      {
        id: '1',
        customerId: 'customer1',
        channel: 'sms',
        subject: 'Support Request',
        status: 'open',
        assignedAgentId: 'agent1',
        priority: 'medium',
        tags: ['support', 'billing'],
        lastMessageAt: new Date('2024-01-20T10:30:00'),
        createdAt: new Date('2024-01-20T09:00:00'),
        updatedAt: new Date('2024-01-20T10:30:00'),
        messageCount: 5,
        unreadCount: 2
      },
      {
        id: '2',
        customerId: 'customer2',
        channel: 'chat',
        subject: 'Product Inquiry',
        status: 'open',
        priority: 'high',
        tags: ['sales', 'product'],
        lastMessageAt: new Date('2024-01-20T11:15:00'),
        createdAt: new Date('2024-01-20T11:00:00'),
        updatedAt: new Date('2024-01-20T11:15:00'),
        messageCount: 3,
        unreadCount: 1
      }
    ];
    setThreads(mockThreads);
  }, []);

  useEffect(() => {
    if (selectedThread) {
      // TODO: Fetch messages for selected thread
      const mockMessages: UnifiedMessage[] = [
        {
          id: '1',
          threadId: selectedThread.id,
          channel: selectedThread.channel,
          direction: 'inbound',
          content: 'Hi, I need help with my billing issue.',
          metadata: {},
          status: 'read',
          timestamp: new Date('2024-01-20T09:00:00'),
          customerId: selectedThread.customerId
        },
        {
          id: '2',
          threadId: selectedThread.id,
          channel: selectedThread.channel,
          direction: 'outbound',
          content: 'Hello! I\'d be happy to help you with your billing question. Can you please provide more details?',
          metadata: {},
          status: 'delivered',
          timestamp: new Date('2024-01-20T09:05:00'),
          customerId: selectedThread.customerId,
          agentId: 'agent1'
        }
      ];
      setMessages(mockMessages);
    }
  }, [selectedThread]);

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         thread.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || thread.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedThread) return;

    const message: UnifiedMessage = {
      id: `msg_${Date.now()}`,
      threadId: selectedThread.id,
      channel: selectedThread.channel,
      direction: 'outbound',
      content: newMessage,
      metadata: {},
      status: 'sent',
      timestamp: new Date(),
      customerId: selectedThread.customerId,
      agentId: 'current_agent'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'voice': return <Phone className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex">
      {/* Thread List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
            >
              <option value="all">All Conversations</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedThread?.id === thread.id ? 'bg-blue-50 border-l-4 border-l-voxlink-blue' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    {getChannelIcon(thread.channel)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{thread.subject || 'No Subject'}</h4>
                    <p className="text-sm text-gray-500">Customer {thread.customerId}</p>
                  </div>
                </div>
                {thread.unreadCount > 0 && (
                  <span className="bg-voxlink-blue text-white text-xs rounded-full px-2 py-1">
                    {thread.unreadCount}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(thread.priority)}`}>
                    {thread.priority}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    thread.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {thread.status}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {thread.lastMessageAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {thread.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {thread.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {tag}
                    </span>
                  ))}
                  {thread.tags.length > 2 && (
                    <span className="text-xs text-gray-500">+{thread.tags.length - 2} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Message Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    {getChannelIcon(selectedThread.channel)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedThread.subject || 'No Subject'}</h3>
                    <p className="text-sm text-gray-500">Customer {selectedThread.customerId} • {selectedThread.channel.toUpperCase()}</p>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.direction === 'outbound'
                      ? 'bg-voxlink-blue text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-voxlink-blue text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the list to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSChats;