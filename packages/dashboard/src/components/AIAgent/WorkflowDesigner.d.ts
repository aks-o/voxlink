import React from 'react';
import { VoiceWorkflow } from '../../../shared/src/types/ai-agent';
interface WorkflowDesignerProps {
    workflow?: VoiceWorkflow;
    onSave: (workflow: Partial<VoiceWorkflow>) => void;
    onCancel: () => void;
}
declare const WorkflowDesigner: React.FC<WorkflowDesignerProps>;
export default WorkflowDesigner;
