"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const path_1 = require("path");
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    resolve: {
        alias: {
            '@': (0, path_1.resolve)(__dirname, './src'),
            '@components': (0, path_1.resolve)(__dirname, './src/components'),
            '@pages': (0, path_1.resolve)(__dirname, './src/pages'),
            '@services': (0, path_1.resolve)(__dirname, './src/services'),
            '@utils': (0, path_1.resolve)(__dirname, './src/utils'),
            '@types': (0, path_1.resolve)(__dirname, './src/types'),
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
