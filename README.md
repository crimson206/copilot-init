# Copilot Bridge

A VS Code extension that exposes [GitHub Copilot chat](https://code.visualstudio.com/docs/copilot/copilot-chat) capabilities as a local API server for programmatic use.

## Features

- Exposes Copilot Chat models through a RESTful API
- Access to multiple AI models including GPT-4, Claude, and more
- Streaming and non-streaming response options
- Simple Python client for easy integration

## Installation

1. Install the VS Code extension
2. Make sure GitHub Copilot Chat is installed and enabled in your VS Code

## Usage

### Starting the Server

1. Use the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and select "Start Copilot API Server"
2. The server will run on a local port (default is 3000, or next available port)
3. A status bar item will display the current port

### Python Client

The easiest way to use the API is with the provided Python client:

```bash
pip install crimson-copilot-init-client
```

#### Example Usage

```python
from crimson.copilot_init_client.client import CopilotClient

# Initialize the client (connects to the local API server)
client = CopilotClient()

# List available models
models = client.list_models()
for model in models:
    print(f"- {model['name']} ({model['vendor']}/{model['family']})")

# Get a completion response
client.chat("Write me a simple Python function to calculate factorial")

# Get a streaming response
for fragment in client.chat_stream("Write me a simple Python function to calculate factorial"):
    print(fragment, end='', flush=True)  # Print fragments as they arrive
```

### Direct API Endpoints

If you prefer to use the API directly, the following endpoints are available:

#### GET `/`

Check if the API server is running.

#### GET `/models`

List all available Copilot models.

#### POST `/chat`

Get a complete (non-streaming) response.

Request body:
```json
{
  "message": "Write a function to calculate factorial",
  "history": [
    {
      "content": "I need help with Python",
      "isUser": true
    },
    {
      "content": "I'd be happy to help with Python. What do you need?",
      "isUser": false
    }
  ],
  "vendor": "copilot",
  "family": "gpt-4"
}
```

#### POST `/chat/stream`

Get a streaming response.

Request body: Same as `/chat` endpoint.

## Configuration

You can configure the extension to auto-start the API server when VS Code starts by adding the following to your settings.json:

```json
{
  "copilotApi.autoStart": true
}
```

## Requirements

- VS Code 1.85.0 or higher
- GitHub Copilot Chat extension installed and enabled

## License

[MIT](LICENSE)