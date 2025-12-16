import React from 'react';
import { AIAgent, CreateAIAgentRequest } from '../../../shared/src/types/ai-agent';
interface AgentBuilderProps {
    agent?: AIAgent;
    onSave: (agent: CreateAIAgentRequest) => void;
    onCancel: () => void;
}
declare const AgentBuilder: React.FC<AgentBuilderProps>;
export default AgentBuilder;
