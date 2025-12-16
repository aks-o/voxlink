import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Settings</h1>
        <p className="text-slate mt-1">
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-charcoal mb-2">Settings</h3>
          <p className="text-slate">
            Settings functionality will be implemented in a future task.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;