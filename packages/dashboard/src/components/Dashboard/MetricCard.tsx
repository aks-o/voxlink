import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: 'blue' | 'teal' | 'green' | 'amber' | 'slate';
  small?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  small = false,
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-voxlink-blue';
      case 'teal':
        return 'bg-teal-50 text-link-teal';
      case 'green':
        return 'bg-green-50 text-success-green';
      case 'amber':
        return 'bg-amber-50 text-warning-amber';
      default:
        return 'bg-gray-50 text-slate';
    }
  };

  const getChangeClasses = (type: string) => {
    switch (type) {
      case 'positive':
        return 'metric-change-positive';
      case 'negative':
        return 'metric-change-negative';
      default:
        return 'text-slate';
    }
  };

  return (
    <div className={`metric-card ${small ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium text-slate ${small ? 'text-xs' : ''}`}>
            {title}
          </p>
          <p className={`metric-value ${small ? 'text-xl' : 'text-2xl'} mt-1`}>
            {value}
          </p>
          <p className={`metric-change ${getChangeClasses(changeType)}`}>
            {change}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
          <Icon className={`${small ? 'w-5 h-5' : 'w-6 h-6'}`} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;