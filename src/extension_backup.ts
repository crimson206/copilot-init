// src/extension.ts

import * as vscode from 'vscode';
import { ApiServer } from './server/server';

let server: ApiServer | undefined;

/**
 * Activates the extension and registers the Copilot API server command
 * @param context The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Copilot API extension is now active');

    // Register the start server command
    const startServerCommand = vscode.commands.registerCommand('copilot-api.start', () => {
        if (server) {
            vscode.window.showInformationMessage('Copilot API server is already running');
            return;
        }
        
        server = new ApiServer();
        server.start()
            .then(() => {
                // Show information about the server
                const port = server?.getPort() || 3000;
                vscode.window.showInformationMessage(
                    `Copilot API server started at http://localhost:${port}`
                );
                
                // Add status bar item
                const statusBarItem = vscode.window.createStatusBarItem(
                    vscode.StatusBarAlignment.Right,
                    100
                );
                statusBarItem.text = `$(copilot) API: ${port}`;
                statusBarItem.tooltip = 'Copilot API server is running';
                statusBarItem.command = 'copilot-api.stop';
                statusBarItem.show();
                
                context.subscriptions.push(statusBarItem);
                
                // Store status bar item in context
                context.workspaceState.update('statusBarItem', statusBarItem);
            })
            .catch(error => {
                vscode.window.showErrorMessage(`Failed to start Copilot API server: ${error.message}`);
                server = undefined;
            });
    });
    
    // Register the stop server command
    const stopServerCommand = vscode.commands.registerCommand('copilot-api.stop', () => {
        if (!server) {
            vscode.window.showInformationMessage('No Copilot API server is running');
            return;
        }
        
        server.stop();
        server = undefined;
        
        // Remove status bar item
        const statusBarItem = context.workspaceState.get<vscode.StatusBarItem>('statusBarItem');
        if (statusBarItem) {
            statusBarItem.dispose();
        }
        
        vscode.window.showInformationMessage('Copilot API server stopped');
    });
    
    context.subscriptions.push(startServerCommand, stopServerCommand);
    
    // Auto-start the server if configured
    const config = vscode.workspace.getConfiguration('copilotApi');
    if (config.get<boolean>('autoStart', false)) {
        vscode.commands.executeCommand('copilot-api.start');
    }
}

/**
 * Deactivates the extension
 */
export function deactivate() {
    if (server) {
        server.stop();
        server = undefined;
    }
}