import { Request, Response } from 'express';
declare class VoiceWorkflowController {
    getWorkflows(req: Request, res: Response): Promise<void>;
    getWorkflow(req: Request, res: Response): Promise<void>;
    createWorkflow(req: Request, res: Response): Promise<void>;
    updateWorkflow(req: Request, res: Response): Promise<void>;
    deleteWorkflow(req: Request, res: Response): Promise<void>;
    toggleWorkflow(req: Request, res: Response): Promise<void>;
    duplicateWorkflow(req: Request, res: Response): Promise<void>;
    getWorkflowAnalytics(req: Request, res: Response): Promise<void>;
}
export declare const voiceWorkflowController: VoiceWorkflowController;
export {};
