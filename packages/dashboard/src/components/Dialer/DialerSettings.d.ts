import React from 'react';
interface DialerSettingsProps {
    dialerType: 'power' | 'parallel' | 'speed';
    onClose?: () => void;
}
declare const DialerSettings: React.FC<DialerSettingsProps>;
export default DialerSettings;
