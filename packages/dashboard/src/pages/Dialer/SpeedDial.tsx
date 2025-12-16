import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Phone, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Star,
  Clock,
  User,
  Building,
  Hash,
  Filter,
  Grid,
  List,
  MoreVertical,
  PhoneCall,
  Zap,
  Heart,
  Bookmark
} from 'lucide-react';
import { SpeedDialEntry, Contact } from '@shared/types/dialer';
import toast from 'react-hot-toast';

const SpeedDial: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SpeedDialEntry | null>(null);
  const [newEntry, setNewEntry] = useState({
    name: '',
    phoneNumber: '',
    description: '',
    category: 'contacts',
    hotkey: '',
  });

  // Mock user ID - replace with actual user context
  const userId = 'current-user-id';

  // Fetch speed dial entries
  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['speed-dial-entries', userId],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: [
              {
                id: 'entry-1',
                name: 'John Smith',
                phoneNumber: '+1 (555) 123-4567',
                description: 'Sales Manager - Acme Corp',
                hotkey: 'F1',
                category: 'contacts',
                priority: 1,
                lastUsed: new Date('2024-01-20T10:30:00Z'),
                usageCount: 45,
              },
              {
                id: 'entry-2',
                name: 'Emergency Support',
                phoneNumber: '+1 (555) 911-0000',
                description: 'Technical emergency hotline',
                hotkey: 'F2',
                category: 'support',
                priority: 0,
                lastUsed: new Date('2024-01-19T15:45:00Z'),
                usageCount: 12,
              },
              {
                id: 'entry-3',
                name: 'Sarah Johnson',
                phoneNumber: '+1 (555) 987-6543',
                description: 'Lead Developer - Tech Solutions',
                hotkey: 'F3',
                category: 'contacts',
                priority: 2,
                lastUsed: new Date('2024-01-18T14:20:00Z'),
                usageCount: 28,
              },
              {
                id: 'entry-4',
                name: 'Sales Hotline',
                phoneNumber: '+1 (555) 800-SALE',
                description: 'Main sales inquiry line',
                hotkey: 'F4',
                category: 'business',
                priority: 1,
                lastUsed: new Date('2024-01-17T09:15:00Z'),
                usageCount: 67,
              },
              {
                id: 'entry-5',
                name: 'Mike Wilson',
                phoneNumber: '+1 (555) 456-7890',
                description: 'Product Manager - Innovation Labs',
                category: 'contacts',
                priority: 3,
                lastUsed: new Date('2024-01-16T11:30:00Z'),
                usageCount: 19,
              },
              {
                id: 'entry-6',
                name: 'Customer Service',
                phoneNumber: '+1 (555) 800-HELP',
                description: '24/7 customer support line',
                hotkey: 'F5',
                category: 'support',
                priority: 1,
                lastUsed: new Date('2024-01-15T16:45:00Z'),
                usageCount: 89,
              },
            ],
          });
        }, 500);
      });
    },
    refetchInterval: 30000,
  });

  // Create speed dial entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (entryData: typeof newEntry) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: 'entry-' + Date.now(),
            ...entryData,
            priority: entries.length + 1,
            lastUsed: undefined,
            usageCount: 0,
          });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast.success('Speed dial entry created successfully!');
      setShowCreateModal(false);
      resetNewEntry();
      queryClient.invalidateQueries({ queryKey: ['speed-dial-entries'] });
    },
    onError: () => {
      toast.error('Failed to create speed dial entry');
    },
  });

  // Update speed dial entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, updates }: { entryId: string; updates: Partial<SpeedDialEntry> }) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(updates), 1000);
      });
    },
    onSuccess: () => {
      toast.success('Speed dial entry updated successfully!');
      setEditingEntry(null);
      queryClient.invalidateQueries({ queryKey: ['speed-dial-entries'] });
    },
    onError: () => {
      toast.error('Failed to update speed dial entry');
    },
  });

  // Delete speed dial entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 1000);
      });
    },
    onSuccess: () => {
      toast.success('Speed dial entry deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['speed-dial-entries'] });
    },
    onError: () => {
      toast.error('Failed to delete speed dial entry');
    },
  });

  // Make call mutation
  const makeCallMutation = useMutation({
    mutationFn: async (entryId: string) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, callId: 'call-' + Date.now() });
        }, 1000);
      });
    },
    onSuccess: (_, entryId) => {
      toast.success('Call initiated successfully!');
      // Update usage count
      updateEntryMutation.mutate({
        entryId,
        updates: { 
          lastUsed: new Date(),
          usageCount: (entries.find(e => e.id === entryId)?.usageCount || 0) + 1
        },
      });
    },
    onError: () => {
      toast.error('Failed to initiate call');
    },
  });

  const entries: SpeedDialEntry[] = entriesData?.data || [];

  const categories = [
    { id: 'all', label: 'All Entries', icon: Grid },
    { id: 'contacts', label: 'Contacts', icon: User },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'support', label: 'Support', icon: Phone },
    { id: 'favorites', label: 'Favorites', icon: Star },
  ];

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.phoneNumber.includes(searchTerm) ||
                         entry.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'favorites' && entry.priority === 0) ||
                           entry.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const resetNewEntry = () => {
    setNewEntry({
      name: '',
      phoneNumber: '',
      description: '',
      category: 'contacts',
      hotkey: '',
    });
  };

  const handleCreateEntry = () => {
    if (!newEntry.name.trim() || !newEntry.phoneNumber.trim()) {
      toast.error('Name and phone number are required');
      return;
    }
    createEntryMutation.mutate(newEntry);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this speed dial entry?')) {
      deleteEntryMutation.mutate(entryId);
    }
  };

  const handleMakeCall = (entryId: string) => {
    makeCallMutation.mutate(entryId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contacts':
        return <User className="w-4 h-4" />;
      case 'business':
        return <Building className="w-4 h-4" />;
      case 'support':
        return <Phone className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: number) => {
    if (priority === 0) return <Star className="w-4 h-4 text-yellow-500" />;
    if (priority === 1) return <Heart className="w-4 h-4 text-red-500" />;
    if (priority === 2) return <Bookmark className="w-4 h-4 text-blue-500" />;
    return null;
  };

  const formatLastUsed = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Speed Dial</h1>
          <p className="text-slate mt-1">
            Quick access to frequently called numbers with one-click dialing
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex border rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-voxlink-blue text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-voxlink-blue text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-voxlink-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed Dial Entries */}
      {filteredEntries.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Phone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-charcoal mb-2">
              {entries.length === 0 ? 'No Speed Dial Entries Yet' : 'No Entries Found'}
            </h3>
            <p className="text-slate mb-6">
              {entries.length === 0 
                ? 'Create your first speed dial entry for quick access to important contacts.'
                : 'Try adjusting your search criteria or filters.'
              }
            </p>
            {entries.length === 0 && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Entry
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-charcoal">
              Speed Dial Entries ({filteredEntries.length})
            </h2>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(entry.category)}
                      <div>
                        <h3 className="font-semibold text-charcoal">{entry.name}</h3>
                        <div className="text-sm text-slate">{entry.phoneNumber}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getPriorityIcon(entry.priority)}
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {entry.description && (
                    <p className="text-sm text-slate mb-3">{entry.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate mb-4">
                    <div className="flex items-center space-x-4">
                      {entry.hotkey && (
                        <div className="flex items-center">
                          <Hash className="w-3 h-3 mr-1" />
                          {entry.hotkey}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatLastUsed(entry.lastUsed)}
                      </div>
                    </div>
                    <div>{entry.usageCount} calls</div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMakeCall(entry.id)}
                      disabled={makeCallMutation.isPending}
                      className="flex-1 btn-primary text-sm"
                    >
                      <PhoneCall className="w-3 h-3 mr-1" />
                      Call
                    </button>
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="btn-secondary text-sm px-3"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="btn-secondary text-sm px-3 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hotkey
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Used
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getCategoryIcon(entry.category)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-charcoal flex items-center">
                              {entry.name}
                              {getPriorityIcon(entry.priority) && (
                                <span className="ml-2">{getPriorityIcon(entry.priority)}</span>
                              )}
                            </div>
                            {entry.description && (
                              <div className="text-sm text-slate">{entry.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                        {entry.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                          {entry.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                        {entry.hotkey && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {entry.hotkey}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                        {entry.usageCount} calls
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate">
                        {formatLastUsed(entry.lastUsed)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleMakeCall(entry.id)}
                            disabled={makeCallMutation.isPending}
                            className="text-voxlink-blue hover:text-blue-700"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingEntry(entry)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Entry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-charcoal mb-4">
              Create Speed Dial Entry
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newEntry.name}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="Contact name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newEntry.phoneNumber}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="input"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Category
                </label>
                <select
                  value={newEntry.category}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value }))}
                  className="input"
                >
                  <option value="contacts">Contacts</option>
                  <option value="business">Business</option>
                  <option value="support">Support</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Hotkey (Optional)
                </label>
                <input
                  type="text"
                  value={newEntry.hotkey}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, hotkey: e.target.value }))}
                  className="input"
                  placeholder="F1, Ctrl+1, etc."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetNewEntry();
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEntry}
                disabled={createEntryMutation.isPending}
                className="flex-1 btn-primary"
              >
                {createEntryMutation.isPending ? 'Creating...' : 'Create Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-charcoal mb-4">
              Edit Speed Dial Entry
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={editingEntry.name}
                  onChange={(e) => setEditingEntry(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="input"
                  placeholder="Contact name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={editingEntry.phoneNumber}
                  onChange={(e) => setEditingEntry(prev => prev ? ({ ...prev, phoneNumber: e.target.value }) : null)}
                  className="input"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={editingEntry.description || ''}
                  onChange={(e) => setEditingEntry(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  className="input"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Category
                </label>
                <select
                  value={editingEntry.category}
                  onChange={(e) => setEditingEntry(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                  className="input"
                >
                  <option value="contacts">Contacts</option>
                  <option value="business">Business</option>
                  <option value="support">Support</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Hotkey (Optional)
                </label>
                <input
                  type="text"
                  value={editingEntry.hotkey || ''}
                  onChange={(e) => setEditingEntry(prev => prev ? ({ ...prev, hotkey: e.target.value }) : null)}
                  className="input"
                  placeholder="F1, Ctrl+1, etc."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setEditingEntry(null)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingEntry) {
                    updateEntryMutation.mutate({
                      entryId: editingEntry.id,
                      updates: editingEntry,
                    });
                  }
                }}
                disabled={updateEntryMutation.isPending}
                className="flex-1 btn-primary"
              >
                {updateEntryMutation.isPending ? 'Updating...' : 'Update Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeedDial;