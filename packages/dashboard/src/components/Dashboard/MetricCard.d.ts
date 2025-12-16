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
declare const MetricCard: React.FC<MetricCardProps>;
export default MetricCard;
