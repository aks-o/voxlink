"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceWorkflowsRouter = void 0;
const express_1 = require("express");
const voice_workflow_controller_1 = require("../controllers/voice-workflow.controller");
const router = (0, express_1.Router)();
exports.voiceWorkflowsRouter = router;
// Voice Workflows CRUD
router.get('/', voice_workflow_controller_1.voiceWorkflowController.getWorkflows);
router.get('/:id', voice_workflow_controller_1.voiceWorkflowController.getWorkflow);
router.post('/', voice_workflow_controller_1.voiceWorkflowController.createWorkflow);
router.put('/:id', voice_workflow_controller_1.voiceWorkflowController.updateWorkflow);
router.delete('/:id', voice_workflow_controller_1.voiceWorkflowController.deleteWorkflow);
router.patch('/:id/status', voice_workflow_controller_1.voiceWorkflowController.toggleWorkflow);
// Workflow Operations
router.post('/:id/duplicate', voice_workflow_controller_1.voiceWorkflowController.duplicateWorkflow);
// Workflow Analytics
router.get('/:id/analytics', voice_workflow_controller_1.voiceWorkflowController.getWorkflowAnalytics);
