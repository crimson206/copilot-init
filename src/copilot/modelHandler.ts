// src/copilot/modelHandler.ts

import * as vscode from 'vscode';
import { ChatMessage, ModelInfo, ModelSelectRequest } from './types';

/**
 * Handles interactions with Copilot language models
 */
export class ModelHandler {
    /**
     * Gets the appropriate language model for chat based on selection criteria
     * @param criteria Optional criteria for model selection
     * @returns Promise containing the selected chat model and its information
     * @throws Error if no suitable model is found
     */
    static async getModel(criteria?: ModelSelectRequest): Promise<{model: vscode.LanguageModelChat, info: ModelInfo}> {
        const selectCriteria: vscode.LanguageModelChatSelector = {};
        
        if (criteria?.vendor) {
            selectCriteria.vendor = criteria.vendor;
        }
        
        if (criteria?.family) {
            selectCriteria.family = criteria.family;
        }
        
        const [model] = await vscode.lm.selectChatModels(selectCriteria);
        
        if (!model) {
            throw new Error('No language model found. Please make sure GitHub Copilot Chat is installed and enabled.');
        }
        
        const modelInfo: ModelInfo = {
            id: model.id,
            name: model.name,
            vendor: model.vendor,
            family: model.family
        };
        
        return { model, info: modelInfo };
    }

    /**
     * Lists all available language models
     * @returns Promise containing an array of available model information
     */
    static async listModels(): Promise<ModelInfo[]> {
        // Get models using getChatModels since listChatModels doesn't exist
        const models = await vscode.lm.selectChatModels();
        
        return models.map((model: vscode.LanguageModelChat) => ({
            id: model.id,
            name: model.name,
            vendor: model.vendor,
            family: model.family
        }));
    }

    /**
     * Generates a response from the language model
     * @param userMessage The current user message
     * @param chatHistory Array of previous chat messages (optional)
     * @param criteria Model selection criteria (optional)
     * @returns AsyncIterable containing the streamed response
     */
    static async getResponse(
        userMessage: string, 
        chatHistory: ChatMessage[] = [],
        criteria?: ModelSelectRequest
    ): Promise<AsyncIterable<string>> {
        const { model } = await this.getModel(criteria);
        
        // Start with a system message
        const messages = [
            vscode.LanguageModelChatMessage.Assistant(
                'You are a helpful assistant who can discuss coding.'
            ),
        ];

        // Add previous chat history to messages
        for (const msg of chatHistory) {
            if (msg.isUser) {
                messages.push(vscode.LanguageModelChatMessage.User(msg.content));
            } else {
                messages.push(vscode.LanguageModelChatMessage.Assistant(msg.content));
            }
        }

        // Add current user message
        messages.push(vscode.LanguageModelChatMessage.User(userMessage));

        const response = await model.sendRequest(
            messages, 
            {}, 
            new vscode.CancellationTokenSource().token
        );

        return response.text;
    }
        
    /**
     * Generates a complete (non-streamed) response from the language model
     * @param userMessage The current user message
     * @param chatHistory Array of previous chat messages (optional)
     * @param criteria Model selection criteria (optional)
     * @returns Promise containing the complete response
     */
    static async getCompleteResponse(
        userMessage: string, 
        chatHistory: ChatMessage[] = [],
        criteria?: ModelSelectRequest
    ): Promise<string> {
        const response = await this.getResponse(userMessage, chatHistory, criteria);
        
        let fullResponse = '';
        for await (const fragment of response) {
            fullResponse += fragment;
        }
        
        return fullResponse;
    }

}