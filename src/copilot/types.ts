// src/copilot/types.ts

export interface ChatMessage {
    content: string;
    isUser: boolean;
}

export interface ChatRequest {
    message: string;
    history?: ChatMessage[];
    stream?: boolean;
}

export interface ModelSelectRequest {
    vendor?: string;
    family?: string;
}

export interface ModelInfo {
    id: string;
    name: string;
    vendor: string;
    family: string;
}