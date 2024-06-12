"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const ws_1 = __importDefault(require("ws"));
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    let panel;
    vscode.window.showInformationMessage(`Activating Assertive extension`);
    const serverExecutable = 'dotnet'; // assumes `dotnet` is in PATH
    const serverPath = 'C:\\dev\\private\\Assertive\\Assertive.LanguageServer\\bin\\Debug\\net8.0\\Assertive.LanguageServer.dll'; //context.asAbsolutePath(path.join('server', 'bin', 'Debug', 'net6.0', 'LspServer.dll'));
    // Server options
    const serverOptions = {
        run: { command: serverExecutable, args: [serverPath] },
        debug: { command: serverExecutable, args: [serverPath] }
    };
    // Client options
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'assertive' }]
    };
    // Create the language client and start the client.
    client = new node_1.LanguageClient('AssertiveLSP', 'Assertive Language Server', serverOptions, clientOptions);
    // Start the client. This will also launch the server
    client.start();
    //start the dotnet websockets server
    // const assemblyPath = "C:\\dev\\private\\Assertive\\Assertive.Server\\bin\\Release\\net8.0\\publish\\Assertive.Server.dll";
    // const cwd = "C:\\dev\\private\\Assertive\\Assertive.Server\\bin\\Release\\net8.0\\publish";
    // exec(`dotnet ${assemblyPath}`, { cwd }, (error, stdout, stderr) => {
    //     if (error) {
    //         vscode.window.showErrorMessage(`Error: ${error.message}`);
    //         return;
    //     }
    //     if (stderr) {
    //         vscode.window.showErrorMessage(`STDERR: ${stderr}`);
    //         return;
    //     }
    //     vscode.window.showInformationMessage(`STDOUT: ${stdout}`);
    // });
    let disposable = vscode.commands.registerCommand('extension.runAssertive', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }
        const document = editor.document;
        const filePath = document.uri.fsPath;
        // Create the Webview panel if it doesn't exist
        if (!panel) {
            panel = vscode.window.createWebviewPanel('assertiveInterpreterOutput', 'Assertive output', vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
            // Get path to resource on disk
            const scriptOnDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'main.js');
            const cssOnDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'main.css');
            // And get the special URI to use with the webview
            const scriptUri = panel.webview.asWebviewUri(scriptOnDiskPath);
            const cssUri = panel.webview.asWebviewUri(cssOnDiskPath);
            panel.webview.html = getWebviewContent(scriptUri, cssUri);
            panel.onDidDispose(() => {
                panel = undefined;
            }, null, context.subscriptions);
        }
        // Connect to the WebSocket server
        const ws = new ws_1.default('ws://localhost:5000/');
        ws.on('open', () => {
            console.log('Connected to Assertive WebSocket server');
            ws.send(filePath); // Send the file path to the WebSocket server
        });
        ws.on('message', (data) => {
            const parsedData = JSON.parse(data.toString());
            if (panel) {
                panel.webview.postMessage(parsedData);
            }
        });
        ws.on('close', () => {
            console.log('Disconnected from Assertive WebSocket server');
        });
    });
    context.subscriptions.push(disposable);
    function getWebviewContent(scriptUri, cssUri) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Assertive output</title>
                <link rel="stylesheet" href="${cssUri}">
            </head>
            <body>
                <h2>Assertive output</h2>
                <div id="output-container"></div>
                <script src="${scriptUri}"/>
            </body>
            </html>
        `;
    }
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map