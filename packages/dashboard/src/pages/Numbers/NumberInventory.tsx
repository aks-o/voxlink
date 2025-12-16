import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Settings, 
  BarChart3, 
  MapPin, 
  DollarSign,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Activity,
  Clock,
  Users,
  Tag,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { numbersApi } from '@services/api';
import { NumberInventoryItem } from '@shared/types/did-management';

// Using NumberInventoryItem from shared types

const NumberInventory: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Mock user ID - replace with actual user context
  const userId = 'current-user-id';

  const { data: numbersData, isLoading, error } = useQuery({
    queryKey: ['user-numbers', userId],
    queryFn: () => numbersApi.getNumbers(userId),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mock enhanced data for development
  const numbers: NumberInventoryItem[] = numbersData?.data || [
    {
      id: '1',
      phoneNumber: '+1 (555) 123-4567',
      countryCode: 'US',
      areaCode: '555',
      city: 'San Francisco',
      region: 'CA',
      status: 'active',
      assignedGroups: ['group-1'],
      monthlyRate: 1000,
      setupFee: 500,
      features: ['VOICE', 'SMS', 'CALL_RECORDING'],
      purchaseDate: new Date('2024-01-10'),
      activationDate: new Date('2024-01-10'),
      lastUsed: new Date('2024-01-20'),
      usageStats: {
        totalCalls: 145,
        totalDuration: 8700,
        totalCost: 4350,
        lastMonth: {
          calls: 45,
          duration: 2700,
          cost: 1350,
        },
      },
      configuration: {
        callForwardingEnabled: true,
        primaryDestination: '+1 (555) 987-6543',
        voicemailEnabled: true,
      },
    },
    {
      id: '2',
      phoneNumber: '+1 (555) 234-5678',
      countryCode: 'US',
      areaCode: '555',
      city: 'Los Angeles',
      region: 'CA',
      status: 'active',
      assignedGroups: ['group-1', 'group-2'],
      monthlyRate: 1000,
      setupFee: 500,
      features: ['VOICE', 'SMS'],
      purchaseDate: new Date('2024-01-12'),
      activationDate: new Date('2024-01-12'),
      lastUsed: new Date('2024-01-19'),
      usageStats: {
        totalCalls: 89,
        totalDuration: 5340,
        totalCost: 2670,
        lastMonth: {
          calls: 32,
          duration: 1920,
          cost: 960,
        },
      },
      configuration: {
        callForwardingEnabled: true,
        primaryDestination: '+1 (555) 876-5432',
        voicemailEnabled: true,
      },
    },
    {
      id: '3',
      phoneNumber: '+1 (555) 345-6789',
      countryCode: 'US',
      areaCode: '555',
      city: 'New York',
      region: 'NY',
      status: 'suspended',
      assignedGroups: [],
      monthlyRate: 1200,
      setupFee: 500,
      features: ['VOICE', 'SMS', 'INTERNATIONAL'],
      purchaseDate: new Date('2024-01-08'),
      activationDate: new Date('2024-01-08'),
      lastUsed: new Date('2024-01-15'),
      usageStats: {
        totalCalls: 12,
        totalDuration: 720,
        totalCost: 360,
        lastMonth: {
          calls: 0,
          duration: 0,
          cost: 0,
        },
      },
      configuration: {
        callForwardingEnabled: false,
        voicemailEnabled: true,
      },
    },
  ];

  const filteredNumbers = numbers.filter((number) => {
    const matchesSearch = number.phoneNumber.includes(searchTerm) ||
                         number.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         number.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || number.status === statusFilter;
    
    const matchesGroup = groupFilter === 'all' || 
                        (groupFilter === 'unassigned' && number.assignedGroups.length === 0) ||
                        number.assignedGroups.includes(groupFilter);
    
    const matchesUsage = usageFilter === 'all' ||
                        (usageFilter === 'high' && number.usageStats.lastMonth.calls > 30) ||
                        (usageFilter === 'medium' && number.usageStats.lastMonth.calls > 10 && number.usageStats.lastMonth.calls <= 30) ||
                        (usageFilter === 'low' && number.usageStats.lastMonth.calls <= 10) ||
                        (usageFilter === 'unused' && number.usageStats.lastMonth.calls === 0);
    
    return matchesSearch && matchesStatus && matchesGroup && matchesUsage;
  });

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'porting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectNumber = (numberId: string) => {
    setSelectedNumbers(prev => 
      prev.includes(numberId) 
        ? prev.filter(id => id !== numberId)
        : [...prev, numberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNumbers.length === filteredNumbers.length) {
      setSelectedNumbers([]);
    } else {
      setSelectedNumbers(filteredNumbers.map(n => n.id));
    }
  };

  const getUsageBadge = (calls: number) => {
    if (calls === 0) return { label: 'Unused', color: 'bg-gray-100 text-gray-800' };
    if (calls <= 10) return { label: 'Low', color: 'bg-yellow-100 text-yellow-800' };
    if (calls <= 30) return { label: 'Medium', color: 'bg-blue-100 text-blue-800' };
    return { label: 'High', color: 'bg-green-100 text-green-800' };
  };

  const NumberCard: React.FC<{ number: NumberInventoryItem }> = ({ number }) => (
    <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
      selectedNumbers.includes(number.id) ? 'ring-2 ring-voxlink-blue border-voxlink-blue' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={selectedNumbers.includes(number.id)}
            onChange={() => handleSelectNumber(number.id)}
            className="mt-1"
          />
          <div>
            <div className="text-lg font-semibold text-charcoal">
              {number.phoneNumber}
            </div>
            <div className="flex items-center text-sm text-slate mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {number.city}, {number.region}
            </div>
            {number.assignedGroups.length > 0 && (
              <div className="flex items-center text-sm text-slate mt-1">
                <Users className="w-3 h-3 mr-1" />
                <span>{number.assignedGroups.length} group{number.assignedGroups.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(number.status)}`}>
            {number.status}
          </span>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded">
        <div className="text-center">
          <div className="text-lg font-semibold text-charcoal">
            {number.usageStats.lastMonth.calls}
          </div>
          <div className="text-xs text-slate">Calls (30d)</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-charcoal">
            {formatPrice(number.usageStats.lastMonth.cost)}
          </div>
          <div className="text-xs text-slate">Cost (30d)</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-charcoal">
            {formatDuration(number.usageStats.lastMonth.duration)}
          </div>
          <div className="text-xs text-slate">Duration (30d)</div>
        </div>
      </div>

      {/* Usage Badge */}
      <div className="mb-4">
        {(() => {
          const usage = getUsageBadge(number.usageStats.lastMonth.calls);
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${usage.color}`}>
              {usage.label} Usage
            </span>
          );
        })()}
        {number.lastUsed && (
          <span className="ml-2 text-xs text-slate">
            Last used {new Date(number.lastUsed).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate">Monthly Rate:</span>
          <span className="font-medium text-charcoal">
            {formatPrice(number.monthlyRate)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate">Active Since:</span>
          <span className="font-medium text-charcoal">
            {new Date(number.activationDate || number.purchaseDate).toLocaleDateString()}
          </span>
        </div>
        {number.assignedGroups.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">Groups:</span>
            <span className="font-medium text-charcoal">
              {number.assignedGroups.length}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {number.features.map((feature) => (
          <span
            key={feature}
            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
          >
            {feature}
          </span>
        ))}
      </div>

      <div className="flex space-x-2">
        <button 
          onClick={() => navigate(`/numbers/configure/${encodeURIComponent(number.phoneNumber)}`)}
          className="flex-1 btn-secondary text-sm"
        >
          <Settings className="w-3 h-3 mr-1" />
          Configure
        </button>
        <button className="flex-1 btn-secondary text-sm">
          <BarChart3 className="w-3 h-3 mr-1" />
          Analytics
        </button>
      </div>
    </div>
  );

  const NumberRow: React.FC<{ number: NumberInventoryItem }> = ({ number }) => (
    <tr className={`hover:bg-gray-50 ${selectedNumbers.includes(number.id) ? 'bg-blue-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedNumbers.includes(number.id)}
            onChange={() => handleSelectNumber(number.id)}
            className="mr-3"
          />
          <Phone className="w-4 h-4 mr-3 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-charcoal">
              {number.phoneNumber}
            </div>
            <div className="text-sm text-slate">
              {number.city}, {number.region}
            </div>
            {number.assignedGroups.length > 0 && (
              <div className="text-xs text-slate flex items-center mt-1">
                <Users className="w-3 h-3 mr-1" />
                {number.assignedGroups.length} group{number.assignedGroups.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(number.status)}`}>
          {number.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
        {formatPrice(number.monthlyRate)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
        <div>
          <div>{number.usageStats.lastMonth.calls}</div>
          {(() => {
            const usage = getUsageBadge(number.usageStats.lastMonth.calls);
            return (
              <span className={`px-1 py-0.5 rounded text-xs ${usage.color}`}>
                {usage.label}
              </span>
            );
          })()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
        {formatPrice(number.usageStats.lastMonth.cost)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
        {new Date(number.activationDate || number.purchaseDate).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button 
            onClick={() => navigate(`/numbers/configure/${encodeURIComponent(number.phoneNumber)}`)}
            className="text-voxlink-blue hover:text-blue-700"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button className="text-primary-blue hover:text-primary-blue-dark">
            <BarChart3 className="w-4 h-4" />
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
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
      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search numbers, cities, or regions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary ${showFilters ? 'bg-gray-100' : ''}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>

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

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="porting">Porting</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Group Assignment</label>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="input"
                >
                  <option value="all">All Numbers</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="group-1">Sales Team</option>
                  <option value="group-2">Support Team</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Usage Level</label>
                <select
                  value={usageFilter}
                  onChange={(e) => setUsageFilter(e.target.value)}
                  className="input"
                >
                  <option value="all">All Usage</option>
                  <option value="high">High (30+ calls)</option>
                  <option value="medium">Medium (10-30 calls)</option>
                  <option value="low">Low (1-10 calls)</option>
                  <option value="unused">Unused (0 calls)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setGroupFilter('all');
                    setUsageFilter('all');
                    setSearchTerm('');
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedNumbers.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-t">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-charcoal">
                  {selectedNumbers.length} number{selectedNumbers.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedNumbers([])}
                  className="text-sm text-slate hover:text-charcoal"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button className="btn-secondary text-sm">
                  <Users className="w-4 h-4 mr-1" />
                  Add to Group
                </button>
                <button className="btn-secondary text-sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </button>
                <button className="btn-secondary text-sm">
                  <Settings className="w-4 h-4 mr-1" />
                  Bulk Configure
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Numbers Display */}
      {filteredNumbers.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Phone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-charcoal mb-2">
              {numbers.length === 0 ? 'No Numbers Yet' : 'No Numbers Found'}
            </h3>
            <p className="text-slate mb-6">
              {numbers.length === 0 
                ? 'Get started by purchasing your first virtual phone number.'
                : 'Try adjusting your search criteria or filters.'
              }
            </p>
            {numbers.length === 0 && (
              <button className="btn-primary">
                <Search className="w-4 h-4 mr-2" />
                Search Numbers
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-charcoal">
              My Numbers ({filteredNumbers.length})
            </h2>
            <div className="text-sm text-slate">
              Total monthly cost: {formatPrice(filteredNumbers.reduce((sum, n) => sum + n.monthlyRate, 0))}
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNumbers.map((number) => (
                <NumberCard key={number.id} number={number} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedNumbers.length === filteredNumbers.length && filteredNumbers.length > 0}
                          onChange={handleSelectAll}
                          className="mr-3"
                        />
                        Number
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage (30d)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost (30d)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Since
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNumbers.map((number) => (
                    <NumberRow key={number.id} number={number} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NumberInventory;