import React from 'react';
import { Integration } from '@voxlink/shared/types/integrations';
interface IntegrationConfigProps {
    integration: Integration;
    onUpdate: () => void;
}
declare const IntegrationConfig: React.FC<IntegrationConfigProps>;
export default IntegrationConfig;
