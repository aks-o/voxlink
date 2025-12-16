import { Request, Response } from 'express';
declare class AIAgentController {
    getAgents(req: Request, res: Response): Promise<void>;
    getAgent(req: Request, res: Response): Promise<void>;
    createAgent(req: Request, res: Response): Promise<void>;
    updateAgent(req: Request, res: Response): Promise<void>;
    deleteAgent(req: Request, res: Response): Promise<void>;
    toggleAgent(req: Request, res: Response): Promise<void>;
    getAgentPerformance(req: Request, res: Response): Promise<void>;
    getVoiceOptions(req: Request, res: Response): Promise<void>;
    previewVoice(req: Request, res: Response): Promise<void>;
}
export declare const aiAgentController: AIAgentController;
export {};
