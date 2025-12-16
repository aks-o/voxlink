import { Router } from 'express';
import { aiAgentController } from '../controllers/ai-agent.controller';

const router = Router();

// AI Agents CRUD
router.get('/', aiAgentController.getAgents);
router.get('/:id', aiAgentController.getAgent);
router.post('/', aiAgentController.createAgent);
router.put('/:id', aiAgentController.updateAgent);
router.delete('/:id', aiAgentController.deleteAgent);
router.patch('/:id/status', aiAgentController.toggleAgent);

// Agent Performance
router.get('/:id/performance', aiAgentController.getAgentPerformance);

// Voice Settings
router.get('/voice-options', aiAgentController.getVoiceOptions);
router.post('/voice-preview', aiAgentController.previewVoice);

export { router as aiAgentsRouter };