import React from 'react';
import { BarChart3 } from 'lucide-react';

const CallChart: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Call Analytics</h3>
        <p className="card-subtitle">Inbound vs Outbound calls over time</p>
      </div>
      
      <div className="flex items-center justify-center h-64 text-slate">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Chart component will be implemented here</p>
          <p className="text-sm mt-2">Integration with Chart.js or D3 coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default CallChart;