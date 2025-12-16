"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockCarrierAPI = void 0;
class CarrierAPIMock {
    constructor() {
        this.portingRequests = new Map();
        this.numberPortability = new Map();
    }
    approvePortingRequest(portingRequestId) {
        const request = this.portingRequests.get(portingRequestId);
        if (request) {
            request.status = 'approved';
            request.updates.push({
                step: 'carrier_approved',
                completedAt: new Date(),
                notes: 'Porting request approved by carrier',
            });
            // Simulate completion after approval
            setTimeout(() => {
                this.completePortingRequest(portingRequestId);
            }, 2000);
        }
    }
    rejectPortingRequest(portingRequestId, reason) {
        const request = this.portingRequests.get(portingRequestId);
        if (request) {
            request.status = 'failed';
            request.updates.push({
                step: 'carrier_rejected',
                completedAt: new Date(),
                notes: reason,
            });
        }
    }
    updatePortingStatus(portingRequestId, status) {
        const request = this.portingRequests.get(portingRequestId);
        if (request) {
            request.updates.push({
                step: status,
                completedAt: new Date(),
            });
        }
    }
    completePortingRequest(portingRequestId) {
        const request = this.portingRequests.get(portingRequestId);
        if (request && request.status === 'approved') {
            request.status = 'completed';
            request.updates.push({
                step: 'completed',
                completedAt: new Date(),
                notes: 'Number successfully ported to VoxLink',
            });
        }
    }
    setNumberPortability(phoneNumber, portable) {
        this.numberPortability.set(phoneNumber, portable);
    }
    isNumberPortable(phoneNumber) {
        return this.numberPortability.get(phoneNumber) ?? true; // Default to portable
    }
    submitPortingRequest(data) {
        const portingRequest = {
            id: `port-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            phoneNumber: data.phoneNumber,
            carrier: data.carrier,
            status: 'submitted',
            estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
            updates: [{
                    step: 'submitted',
                    completedAt: new Date(),
                    notes: 'Porting request submitted to carrier',
                }],
        };
        this.portingRequests.set(portingRequest.id, portingRequest);
        // Simulate processing
        setTimeout(() => {
            this.processPortingRequest(portingRequest.id);
        }, 1000);
        return portingRequest;
    }
    processPortingRequest(portingRequestId) {
        const request = this.portingRequests.get(portingRequestId);
        if (!request)
            return;
        request.status = 'processing';
        request.updates.push({
            step: 'carrier_validation',
            completedAt: new Date(),
            notes: 'Validating account information with carrier',
        });
        // Simulate validation steps
        const validationSteps = [
            'number_verification',
            'account_validation',
            'authorization_check',
        ];
        validationSteps.forEach((step, index) => {
            setTimeout(() => {
                if (request.status === 'processing') {
                    request.updates.push({
                        step,
                        completedAt: new Date(),
                    });
                }
            }, (index + 1) * 1000);
        });
        // Auto-approve after validation (in real scenario, this would be manual)
        setTimeout(() => {
            if (request.status === 'processing') {
                this.approvePortingRequest(portingRequestId);
            }
        }, 5000);
    }
    getPortingStatus(portingRequestId) {
        return this.portingRequests.get(portingRequestId) || null;
    }
    // Simulate different carrier behaviors
    simulateCarrierDelay(carrier) {
        const delays = {
            'Verizon': 3000,
            'AT&T': 2000,
            'T-Mobile': 2500,
            'Sprint': 4000,
        };
        return delays[carrier] || 3000;
    }
    simulateCarrierFailure(carrier) {
        const failureRates = {
            'Verizon': 0.05, // 5% failure rate
            'AT&T': 0.03, // 3% failure rate
            'T-Mobile': 0.04, // 4% failure rate
            'Sprint': 0.08, // 8% failure rate
        };
        const rate = failureRates[carrier] || 0.05;
        return Math.random() < rate;
    }
    reset() {
        this.portingRequests.clear();
        this.numberPortability.clear();
    }
    // Helper methods for testing
    getAllPortingRequests() {
        return Array.from(this.portingRequests.values());
    }
    getPortingRequestsByStatus(status) {
        return Array.from(this.portingRequests.values()).filter(req => req.status === status);
    }
}
exports.mockCarrierAPI = new CarrierAPIMock();
