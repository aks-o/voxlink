import React from 'react';
interface Call {
    id: number;
    agent: string;
    number: string;
    duration: number;
    status: string;
}
interface LiveCallsProps {
    calls?: Call[];
}
declare const LiveCalls: React.FC<LiveCallsProps>;
export default LiveCalls;
