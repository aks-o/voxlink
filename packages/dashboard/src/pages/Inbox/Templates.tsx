import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText, Edit, Trash2, Copy, Eye, MessageSquare, Mail, Phone, Smartphone } from 'lucide-react';
import { MessageTemplate, TemplateVariable, MessageChannel } from '../../../shared/src/types/messaging';

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState<'all' | MessageChannel>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockTemplates: MessageTemplate[] = [
        {
          id: '1',
          name: 'Welcome Message',
          description: 'Welcome new customers to our service',
          content: 'Hi {{firstName}}, welcome to VoxLink! We\'re excited to have you on board. Your account is now active and ready to use.',
          variables: [
            { name: 'firstName', type: 'text', required: true, description: 'Customer first name' }
          ],
          channel: 'sms',
          category: 'onboarding',
          isActive: true,
          usageCount: 245,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          createdBy: 'user1'
        },
        {
          id: '2',
          name: 'Appointment Reminder',
          description: 'Remind customers about upcoming appointments',
          content: 'Hi {{customerName}}, this is a reminder about your appointment on {{appointmentDate}} at {{appointmentTime}}. Please reply CONFIRM to confirm or RESCHEDULE to change the time.',
          variables: [
            { name: 'customerName', type: 'text', required: true, description: 'Customer name' },
            { name: 'appointmentDate', type: 'date', required: true, description: 'Appointment date' },
            { name: 'appointmentTime', type: 'text', required: true, description: 'Appointment time' }
          ],
          channel: 'sms',
          category: 'appointments',
          isActive: true,
          usageCount: 189,
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-18'),
          createdBy: 'user1'
        },
        {
          id: '3',
          name: 'Support Follow-up',
          description: 'Follow up with customers after support interactions',
          content: 'Dear {{customerName}},\n\nThank you for contacting our support team. We hope we were able to resolve your {{issueType}} issue satisfactorily.\n\nIf you have any additional questions, please don\'t hesitate to reach out.\n\nBest regards,\nVoxLink Support Team',
          variables: [
            { name: 'customerName', type: 'text', required: true, description: 'Customer name' },
            { name: 'issueType', type: 'select', required: true, options: ['billing', 'technical', 'general'], description: 'Type of support issue' }
          ],
          channel: 'email',
          category: 'support',
          isActive: true,
          usageCount: 156,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-19'),
          createdBy: 'user2'
        },
        {
          id: '4',
          name: 'Payment Confirmation',
          description: 'Confirm successful payments',
          content: 'Payment received! Thank you {{customerName}} for your payment of ${{amount}}. Your account has been updated. Transaction ID: {{transactionId}}',
          variables: [
            { name: 'customerName', type: 'text', required: true, description: 'Customer name' },
            { name: 'amount', type: 'number', required: true, description: 'Payment amount' },
            { name: 'transactionId', type: 'text', required: true, description: 'Transaction ID' }
          ],
          channel: 'sms',
          category: 'billing',
          isActive: true,
          usageCount: 98,
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-16'),
          createdBy: 'user1'
        },
        {
          id: '5',
          name: 'Promotional Offer',
          description: 'Special promotional offers for customers',
          content: 'Exclusive offer for you, {{customerName}}! Get {{discountPercent}}% off your next purchase. Use code {{promoCode}} at checkout. Valid until {{expiryDate}}.',
          variables: [
            { name: 'customerName', type: 'text', required: true, description: 'Customer name' },
            { name: 'discountPercent', type: 'number', required: true, description: 'Discount percentage' },
            { name: 'promoCode', type: 'text', required: true, description: 'Promotional code' },
            { name: 'expiryDate', type: 'date', required: true, description: 'Offer expiry date' }
          ],
          channel: 'sms',
          category: 'marketing',
          isActive: false,
          usageCount: 67,
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-14'),
          createdBy: 'user2'
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = filterChannel === 'all' || template.channel === filterChannel;
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesChannel && matchesCategory;
  });

  const getChannelIcon = (channel: MessageChannel) => {
    switch (channel) {
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'voice': return <Phone className="w-4 h-4" />;
      case 'whatsapp': return <Smartphone className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel: MessageChannel) => {
    switch (channel) {
      case 'sms': return 'bg-blue-100 text-blue-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'voice': return 'bg-purple-100 text-purple-800';
      case 'whatsapp': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'onboarding': return 'bg-blue-100 text-blue-800';
      case 'appointments': return 'bg-orange-100 text-orange-800';
      case 'support': return 'bg-purple-100 text-purple-800';
      case 'billing': return 'bg-green-100 text-green-800';
      case 'marketing': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDuplicateTemplate = async (template: MessageTemplate) => {
    try {
      const duplicatedTemplate: MessageTemplate = {
        ...template,
        id: `template_${Date.now()}`,
        name: `${template.name} (Copy)`,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setTemplates(prev => [...prev, duplicatedTemplate]);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        setTemplates(prev => prev.filter(template => template.id !== templateId));
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const renderPreviewContent = (content: string, variables: TemplateVariable[]) => {
    let previewContent = content;
    variables.forEach(variable => {
      const placeholder = `{{${variable.name}}}`;
      let sampleValue = '';
      
      switch (variable.type) {
        case 'text':
          sampleValue = variable.name === 'firstName' || variable.name === 'customerName' ? 'John Doe' : 'Sample Text';
          break;
        case 'number':
          sampleValue = variable.name.includes('amount') ? '99.99' : '123';
          break;
        case 'date':
          sampleValue = new Date().toLocaleDateString();
          break;
        case 'select':
          sampleValue = variable.options?.[0] || 'Option 1';
          break;
        default:
          sampleValue = 'Sample Value';
      }
      
      previewContent = previewContent.replace(new RegExp(placeholder, 'g'), sampleValue);
    });
    
    return previewContent;
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage reusable message templates</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
            >
              <option value="all">All Channels</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="chat">Chat</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-voxlink-blue"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChannelColor(template.channel)}`}>
                        {getChannelIcon(template.channel)}
                        <span className="ml-1 capitalize">{template.channel}</span>
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{template.description}</p>

              {/* Template Preview */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-xs font-medium text-gray-500 mb-2">PREVIEW:</div>
                <div className="text-sm text-gray-700 line-clamp-3">
                  {renderPreviewContent(template.content, template.variables)}
                </div>
              </div>

              {/* Variables */}
              {template.variables.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 mb-2">VARIABLES:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map((variable, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                      >
                        {variable.name}
                      </span>
                    ))}
                    {template.variables.length > 3 && (
                      <span className="text-xs text-gray-500">+{template.variables.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Category and Usage */}
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                  {template.category}
                </span>
                <span className="text-sm text-gray-500">
                  Used {template.usageCount} times
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Preview Template"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Edit Template"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Duplicate Template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredTemplates.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterChannel !== 'all' || filterCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first message template to get started'
            }
          </p>
          {!searchTerm && filterChannel === 'all' && filterCategory === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </button>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Template Preview</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">{previewTemplate.name}</h4>
                <p className="text-gray-600 text-sm">{previewTemplate.description}</p>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Channel & Category:</div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChannelColor(previewTemplate.channel)}`}>
                    {getChannelIcon(previewTemplate.channel)}
                    <span className="ml-1 capitalize">{previewTemplate.channel}</span>
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(previewTemplate.category)}`}>
                    {previewTemplate.category}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Template Content:</div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {previewTemplate.content}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Preview with Sample Data:</div>
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {renderPreviewContent(previewTemplate.content, previewTemplate.variables)}
                </div>
              </div>

              {previewTemplate.variables.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Variables:</div>
                  <div className="space-y-2">
                    {previewTemplate.variables.map((variable, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium text-gray-900">{variable.name}</span>
                          {variable.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <div className="text-sm text-gray-600">
                          {variable.type} {variable.options && `(${variable.options.join(', ')})`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;