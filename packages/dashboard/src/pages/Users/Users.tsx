import React from 'react';
import { Users as UsersIcon } from 'lucide-react';

const Users: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Users & Performance</h1>
        <p className="text-slate mt-1">Team management and performance tracking</p>
      </div>
      <div className="card">
        <div className="text-center py-12">
          <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-charcoal mb-2">Team Management</h3>
          <p className="text-slate">User management and performance metrics coming soon.</p>
        </div>
      </div>
    </div>
  );
};

export default Users;