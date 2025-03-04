import * as vscode from 'vscode';
import { ApiServer } from './server/server';

let server: ApiServer | undefined;
let outputChannel: vscode.OutputChannel;

/**
 * Activates the extension and registers the Copilot API server command
 * @param context The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
    // Create output channel
    outputChannel = vscode.window.createOutputChannel('Copilot API');
    context.subscriptions.push(outputChannel);
    
    // Log activation message
    logMessage('Copilot API extension is now active');

    // Register the start server command
    const startServerCommand = vscode.commands.registerCommand('copilot-api.start', () => {
        if (server) {
            logMessage('Copilot API server is already running');
            return;
        }
        
        server = new ApiServer();
        server.start()
            .then(() => {
                const port = server?.getPort() || 3000;
                
                // Only log to output channel, no popup messages
                logMessage(`Copilot API server started at http://localhost:${port}`);
                
                // Add status bar item
                updateStatusBar(context, port);
            })
            .catch(error => {
                logMessage(`Failed to start Copilot API server: ${error.message}`, true);
            });
    });
    
    // Register the stop server command
    const stopServerCommand = vscode.commands.registerCommand('copilot-api.stop', () => {
        if (!server) {
            logMessage('No Copilot API server is running');
            return;
        }
        
        server.stop();
        server = undefined;
        
        // Update context
        vscode.commands.executeCommand('setContext', 'copilotApiServerRunning', false);

        // Remove status bar item
        const statusBarItem = context.workspaceState.get<vscode.StatusBarItem>('statusBarItem');
        if (statusBarItem) {
            statusBarItem.dispose();
        }
        
        logMessage('Copilot API server stopped');
    });
    
    context.subscriptions.push(startServerCommand, stopServerCommand);
    
    // Auto-start the server if configured
    const config = vscode.workspace.getConfiguration('copilotApi');
    if (config.get<boolean>('autoStart', false)) {
        vscode.commands.executeCommand('copilot-api.start');
    }
}

/**
 * Logs a message to the output channel
 * @param message The message to log
 * @param isError Whether this is an error message
 */
function logMessage(message: string, isError = false): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    
    // Write to output channel
    outputChannel.appendLine(formattedMessage);
    
    // Also log to console for debugging
    if (isError) {
        console.error(formattedMessage);
    } else {
        console.log(formattedMessage);
    }
}

/**
 * Updates the status bar with server information
 * @param context The extension context
 * @param port The server port
 */
function updateStatusBar(context: vscode.ExtensionContext, port: number): void {
    // Remove existing status bar item if it exists
    const existingStatusBarItem = context.workspaceState.get<vscode.StatusBarItem>('statusBarItem');
    if (existingStatusBarItem) {
        existingStatusBarItem.dispose();
    }
    
    // Create new status bar item
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = `$(copilot) API: ${port}`;
    statusBarItem.tooltip = 'Copilot API server is running';
    statusBarItem.command = 'copilot-api.stop';
    statusBarItem.show();
    
    context.subscriptions.push(statusBarItem);
    context.workspaceState.update('statusBarItem', statusBarItem);
}

/**
 * Deactivates the extension
 */
export function deactivate() {
    if (server) {
        server.stop();
        logMessage('Server stopped during extension deactivation');
        server = undefined;
    }
}