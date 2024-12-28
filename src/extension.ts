import * as vscode from "vscode";
import Groq from "groq-sdk";

export function activate(context: vscode.ExtensionContext) {
  const apiKey = "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"; // Replace with your actual API key

  if (!apiKey) {
    vscode.window.showErrorMessage("GROQ_API_KEY is not set.");
    return;
  }

  const groq = new Groq({ apiKey: apiKey });

  const panel = vscode.window.createWebviewPanel(
    "sidebarCopilot",
    "SmartCoder",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  panel.webview.html = getWebviewContent();

  panel.webview.onDidReceiveMessage(
    async (message) => {
      if (message.command === "askGroq") {
        try {
          const completion = await groq.chat.completions.create({
            messages: [
              {
                role: "user",
                content: message.text,
              },
            ],
            model: message.model || "mixtral-8x7b-32768", // Default model
          });

          const response =
            completion.choices[0]?.message?.content || "No response";
          panel.webview.postMessage({ command: "showResponse", response });
        } catch (error) {
          const err = error as Error;
          panel.webview.postMessage({
            command: "showResponse",
            response: `Error: ${err.message}`,
          });
        }
      }
    },
    undefined,
    context.subscriptions
  );
}

function getWebviewContent() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SmartCoder</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #1e1e1e;
          color: #d4d4d4;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #252526;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        h1 {
          text-align: center;
          color: #ffffff;
        }
        select, textarea, button {
          width: 100%;
          padding: 10px;
          margin: 10px 0;
          border: none;
          border-radius: 4px;
          font-size: 16px;
        }
        select {
          background-color: #3c3c3c;
          color: #ffffff;
        }
        textarea {
          background-color: #1e1e1e;
          color: #d4d4d4;
          resize: vertical;
          height: 100px;
        }
        button {
          background-color: #007acc;
          color: white;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        button:hover {
          background-color: #005fa2;
        }
        .response-container {
          background-color: #1e1e1e;
          color: #d4d4d4;
          padding: 15px;
          border-radius: 4px;
          margin-top: 10px;
          white-space: pre-wrap;
          word-wrap: break-word;
          max-height: 300px;
          overflow-y: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SmartCoder</h1>
        <label for="modelSelect">Choose a model:</label>
        <select id="modelSelect">
          <option value="mixtral-8x7b-32768">Mixtral-8x7b (default)</option>
          <option value="gemma2-9b-it">Gemma2-9b</option>
          <option value="llama3-8b-8192">Llama3-8b</option>
        </select>
        <textarea id="input" placeholder="Ask your question here..."></textarea>
        <button id="ask">Ask</button>
        <div id="response" class="response-container">
          Response will appear here...
        </div>
      </div>
      <script>
        const vscode = acquireVsCodeApi();

        document.getElementById("ask").addEventListener("click", () => {
          const input = document.getElementById("input").value.trim();
          const model = document.getElementById("modelSelect").value;
          if (input === "") {
            vscode.postMessage({ command: "showResponse", response: "Please enter a question." });
            return;
          }
          vscode.postMessage({ command: "askGroq", text: input, model: model });
        });

        window.addEventListener("message", (event) => {
          const message = event.data;
          if (message.command === "showResponse") {
            document.getElementById("response").textContent = message.response;
          }
        });
      </script>
    </body>
    </html>
  `;
}

export function deactivate() {}
