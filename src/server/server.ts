// src/server/server.ts

import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import * as vscode from 'vscode';
import * as http from 'http';
import { setupRoutes } from './routes';

/**
 * API Server for Copilot interaction
 */
export class ApiServer {
    private app: express.Express;
    private server: http.Server | null = null;
    private port: number = 3000;
    
    constructor() {
        this.app = express();
        this.configureMiddleware();
        setupRoutes(this.app);
    }
    
    /**
     * Configure Express middleware
     */
    private configureMiddleware(): void {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use((req, res, next) => {
            console.log(`${req.method} ${req.url}`);
            next();
        });
    }
    
    /**
     * Start the API server
     * @returns Promise that resolves when server is started
     */
    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Find an available port
                this.findAvailablePort()
                    .then(port => {
                        this.port = port;
                        this.server = this.app.listen(this.port, () => {
                            vscode.window.showInformationMessage(
                                `Copilot API server running at http://localhost:${this.port}`
                            );
                            resolve();
                        });
                    })
                    .catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Stop the API server
     */
    public stop(): void {
        if (this.server) {
            this.server.close();
            this.server = null;
            vscode.window.showInformationMessage('Copilot API server stopped');
        }
    }
    
    /**
     * Find an available port starting from 3000
     * @returns Promise containing an available port
     */
    private async findAvailablePort(startPort: number = 3000, maxAttempts: number = 10): Promise<number> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const port = startPort + attempt;
            try {
                await this.checkPortAvailable(port);
                return port;
            } catch (error) {
                console.log(`Port ${port} is not available, trying next...`);
            }
        }
        throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
    }
    
    /**
     * Check if a port is available
     * @param port The port to check
     * @returns Promise that resolves if port is available
     */
    private checkPortAvailable(port: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const server = http.createServer();
            
            server.once('error', (err: any) => {
                server.close();
                if (err.code === 'EADDRINUSE') {
                    reject(new Error(`Port ${port} is in use`));
                } else {
                    reject(err);
                }
            });
            
            server.once('listening', () => {
                server.close();
                resolve();
            });
            
            server.listen(port);
        });
    }
    
    /**
     * Get the current server port
     * @returns The port number
     */
    public getPort(): number {
        return this.port;
    }
}