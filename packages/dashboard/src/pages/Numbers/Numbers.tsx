import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Phone, Plus, Search, Filter, Grid, List, Users, Settings, ShoppingCart } from 'lucide-react';
import NumberSearch from './NumberSearch';
import NumberInventory from './NumberInventory';
import NumberPurchase from './NumberPurchase';
import NumberConfiguration from './NumberConfiguration';
import DIDGroups from './DIDGroups';
import DIDGroupManager from '../../components/DIDGroupManager';
import RoutingConfig from '../../components/RoutingConfig';

const Numbers: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');

  const tabs = [
    { id: 'inventory', label: 'My Numbers', icon: Phone },
    { id: 'search', label: 'Search Numbers', icon: Search },
    { id: 'groups', label: 'DID Groups', icon: Users },
    { id: 'routing', label: 'Routing Config', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Number Management</h1>
          <p className="text-slate mt-1">
            Search, purchase, and manage your virtual phone numbers
          </p>
        </div>
        <button 
          className="btn-primary mt-4 sm:mt-0"
          onClick={() => setActiveTab('search')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Get New Number
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-voxlink-blue text-voxlink-blue'
                    : 'border-transparent text-slate hover:text-charcoal hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'inventory' && <NumberInventory />}
        {activeTab === 'search' && <NumberSearch />}
        {activeTab === 'groups' && <DIDGroups />}
        {activeTab === 'routing' && <RoutingConfig />}
      </div>

      {/* Routes for nested pages */}
      <Routes>
        <Route path="purchase/:phoneNumber" element={<NumberPurchase />} />
        <Route path="configure/:phoneNumber" element={<NumberConfiguration />} />
        <Route path="groups/:groupId" element={<DIDGroupManager />} />
      </Routes>
    </div>
  );
};

export default Numbers;