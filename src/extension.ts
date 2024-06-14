import * as vscode from 'vscode';
import * as path from 'path';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions
} from 'vscode-languageclient/node';

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

    client.onNotification('assertive/RequestStart', (params: string ) => {
        const parsedData = JSON.parse(params);
        if (panel) {
            panel.webview.postMessage(parsedData);
        }
    });

    client.onNotification('assertive/RequestEnd', (params: string ) => {
        const parsedData = JSON.parse(params);
        if (panel) {
            panel.webview.postMessage(parsedData);
        }
    });

    client.onNotification('assertive/output', (params: string ) => {
        const parsedData = JSON.parse(params);
        if (panel) {
            panel.webview.postMessage(parsedData);
        }
    });

    client.onNotification('assertive/AnnotatedFunctionStart', (params: string ) => {
        const parsedData = JSON.parse(params);
        if (panel) {
            panel.webview.postMessage(parsedData);
        }
    });

    client.onNotification('assertive/AnnotatedFunctionEnd', (params: string ) => {
        const parsedData = JSON.parse(params);
        if (panel) {
            panel.webview.postMessage(parsedData);
        }
    });

    client.onNotification('assertive/Assertion', (params: string ) => {
        const parsedData = JSON.parse(params);
        if (panel) {
            panel.webview.postMessage(parsedData);
        }
    });


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

        const interpreterRequest: InterpretationRequest = { filePath: filePath };
        client.sendNotification('assertive/interpreterRequest', interpreterRequest,);


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

interface InterpretationRequest {
    filePath: string;
}