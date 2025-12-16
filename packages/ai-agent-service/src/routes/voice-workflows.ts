import { Router } from 'express';
import { voiceWorkflowController } from '../controllers/voice-workflow.controller';

const router = Router();

// Voice Workflows CRUD
router.get('/', voiceWorkflowController.getWorkflows);
router.get('/:id', voiceWorkflowController.getWorkflow);
router.post('/', voiceWorkflowController.createWorkflow);
router.put('/:id', voiceWorkflowController.updateWorkflow);
router.delete('/:id', voiceWorkflowController.deleteWorkflow);
router.patch('/:id/status', voiceWorkflowController.toggleWorkflow);

// Workflow Operations
router.post('/:id/duplicate', voiceWorkflowController.duplicateWorkflow);

// Workflow Analytics
router.get('/:id/analytics', voiceWorkflowController.getWorkflowAnalytics);

export { router as voiceWorkflowsRouter };