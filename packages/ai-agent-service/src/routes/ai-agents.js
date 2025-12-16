"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAgentsRouter = void 0;
const express_1 = require("express");
const ai_agent_controller_1 = require("../controllers/ai-agent.controller");
const router = (0, express_1.Router)();
exports.aiAgentsRouter = router;
// AI Agents CRUD
router.get('/', ai_agent_controller_1.aiAgentController.getAgents);
router.get('/:id', ai_agent_controller_1.aiAgentController.getAgent);
router.post('/', ai_agent_controller_1.aiAgentController.createAgent);
router.put('/:id', ai_agent_controller_1.aiAgentController.updateAgent);
router.delete('/:id', ai_agent_controller_1.aiAgentController.deleteAgent);
router.patch('/:id/status', ai_agent_controller_1.aiAgentController.toggleAgent);
// Agent Performance
router.get('/:id/performance', ai_agent_controller_1.aiAgentController.getAgentPerformance);
// Voice Settings
router.get('/voice-options', ai_agent_controller_1.aiAgentController.getVoiceOptions);
router.post('/voice-preview', ai_agent_controller_1.aiAgentController.previewVoice);
