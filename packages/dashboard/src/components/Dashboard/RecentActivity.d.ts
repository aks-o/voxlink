import React from 'react';
interface Activity {
    id: number;
    type: string;
    title: string;
    time: string;
    status: string;
}
interface RecentActivityProps {
    activities?: Activity[];
}
declare const RecentActivity: React.FC<RecentActivityProps>;
export default RecentActivity;
