import React from 'react';
interface ConfigurationTest {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    status: 'pending' | 'running' | 'passed' | 'failed';
    message?: string;
}
interface ConfigurationTesterProps {
    phoneNumber: string;
    onTestComplete?: (results: ConfigurationTest[]) => void;
}
declare const ConfigurationTester: React.FC<ConfigurationTesterProps>;
export default ConfigurationTester;
