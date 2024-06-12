import * as vscode from 'vscode';
import WebSocket from 'ws';
import * as path from 'path';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions
} from 'vscode-languageclient/node';
import { exec } from 'child_process';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    let panel: vscode.WebviewPanel | undefined;

    vscode.window.showInformationMessage(`Activating Assertive extension`);

    const serverExecutable = 'dotnet'; // assumes `dotnet` is in PATH
    const serverPath = 'C:\\dev\\private\\Assertive\\Assertive.LanguageServer\\bin\\Debug\\net8.0\\Assertive.LanguageServer.dll';//context.asAbsolutePath(path.join('server', 'bin', 'Debug', 'net6.0', 'LspServer.dll'));

    // Server options
    const serverOptions: ServerOptions = {
        run: { command: serverExecutable, args: [serverPath] },
        debug: { command: serverExecutable, args: [serverPath] }
    };

    // Client options
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'assertive' }]
    };

    // Create the language client and start the client.
    client = new LanguageClient(
        'AssertiveLSP',
        'Assertive Language Server',
        serverOptions,
        clientOptions
    );

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
            panel = vscode.window.createWebviewPanel(
                'assertiveInterpreterOutput',
                'Assertive output',
                vscode.ViewColumn.One,
                { enableScripts: true, retainContextWhenHidden: true }
            );

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
        const ws = new WebSocket('ws://localhost:5000/');
        ws.on('open', () => {
            console.log('Connected to Assertive WebSocket server');
            ws.send(filePath);  // Send the file path to the WebSocket server
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

    function getWebviewContent(scriptUri: vscode.Uri, cssUri: vscode.Uri): string {
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

export function deactivate() { }