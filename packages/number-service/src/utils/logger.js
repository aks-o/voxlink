"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measurePerformance = exports.logger = void 0;
const shared_1 = require("@voxlink/shared");
Object.defineProperty(exports, "measurePerformance", { enumerable: true, get: function () { return shared_1.measurePerformance; } });
// Create logger instance for Number Service
exports.logger = (0, shared_1.createLogger)('number-service');
