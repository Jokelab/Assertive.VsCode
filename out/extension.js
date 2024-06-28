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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    let panel;
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
    client.onNotification('assertive/RequestStart', processNotification);
    client.onNotification('assertive/RequestEnd', processNotification);
    client.onNotification('assertive/output', processNotification);
    client.onNotification('assertive/AnnotatedFunctionStart', processNotification);
    client.onNotification('assertive/AnnotatedFunctionEnd', processNotification);
    client.onNotification('assertive/Assertion', processNotification);
    client.onNotification('assertive/started', () => {
        vscode.window.showInformationMessage(`Assertive Language Server started`);
    });
    // Start the client. This will also launch the server
    client.start();
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
            panel = vscode.window.createWebviewPanel('assertiveInterpreterOutput', 'Assertive output', vscode.ViewColumn.Three, { enableScripts: true, retainContextWhenHidden: true });
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
        const interpreterRequest = { filePath: filePath };
        client.sendNotification('assertive/interpreterRequest', interpreterRequest);
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
    function processNotification(content) {
        const parsedData = JSON.parse(content);
        if (panel) {
            panel.webview.postMessage(parsedData);
        }
    }
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map