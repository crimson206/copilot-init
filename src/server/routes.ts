// src/server/routes.ts

import * as express from 'express';
import { ModelHandler } from '../copilot/modelHandler';
import { ChatRequest, ModelSelectRequest } from '../copilot/types';

/**
 * Sets up API routes for the express server
 * @param app Express application instance
 */
export function setupRoutes(app: express.Express): void {
    /**
     * Root endpoint to check if the API is running
     */
    app.get('/', (req, res) => {
        res.json({
            status: 'ok',
            message: 'Copilot API server is running'
        });
    });
    
    /**
     * List available models endpoint
     */
    app.get('/models', async (req, res) => {
        try {
            const models = await ModelHandler.listModels();
            res.json({
                status: 'ok',
                models
            });
        } catch (error) {
            console.error('Error listing models:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    
    /**
     * Complete chat endpoint (non-streaming)
     */
    app.post('/chat', async (req, res) => {
        try {
            const chatRequest: ChatRequest = req.body;
            
            if (!chatRequest.message) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Message is required'
                });
            }
            
            const criteria: ModelSelectRequest = {
                vendor: req.body.vendor,
                family: req.body.family
            };
            
            const response = await ModelHandler.getCompleteResponse(
                chatRequest.message,
                chatRequest.history,
                criteria
            );
            
            res.json({
                status: 'ok',
                response
            });
        } catch (error) {
            console.error('Error generating chat response:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    
    /**
     * Streaming chat endpoint
     */
    app.post('/chat/stream', async (req, res) => {
        try {
            const chatRequest: ChatRequest = req.body;
            
            if (!chatRequest.message) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Message is required'
                });
            }
            
            const criteria: ModelSelectRequest = {
                vendor: req.body.vendor,
                family: req.body.family
            };
            
            // Set headers for server-sent events
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            
            try {
                const response = await ModelHandler.getResponse(
                    chatRequest.message,
                    chatRequest.history,
                    criteria
                );
                
                for await (const fragment of response) {
                    res.write(`data: ${JSON.stringify({ fragment })}\n\n`);
                }
                
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                res.end();
            } catch (error) {
                console.error('Error in stream:', error);
                res.write(`data: ${JSON.stringify({ 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                })}\n\n`);
                res.end();
            }
        } catch (error) {
            console.error('Error setting up stream:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
}