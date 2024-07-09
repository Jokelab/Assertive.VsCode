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

    const serverExecutable = 'dotnet'; // assumes `dotnet` is in PATH
    const serverPath = 'C:\\dev\\private\\Assertive\\Assertive.LanguageServer\\bin\\Debug\\net8.0\\Assertive.LanguageServer.dll';
    //const serverPath = context.asAbsolutePath(path.join('server', 'Assertive.LanguageServer.dll'));

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

    client.onNotification('assertive/RequestStart',processNotification);

    client.onNotification('assertive/RequestEnd', processNotification);

    client.onNotification('assertive/output', processNotification);

    client.onNotification('assertive/AnnotatedFunctionStart',  processNotification);

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
            panel = vscode.window.createWebviewPanel(
                'assertiveInterpreterOutput',
                'Assertive output',
                vscode.ViewColumn.Three,
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

        const interpreterRequest: InterpreterRequest = { filePath: filePath };
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

    function processNotification(content: string): void{
        const parsedData = JSON.parse(content);
        if (panel) {
            panel.webview.postMessage(parsedData);
        }
    }
}

export function deactivate() { }

interface InterpreterRequest {
    filePath: string;
}