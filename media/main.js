const vscode = acquireVsCodeApi();
window.addEventListener('message', event => {
    const data = event.data;
    const outputContainer = document.getElementById('output-container');
    if (Object.hasOwn(data, 'Id')) {
        const requestButtonId = 'btn' + data.Id;
        const requestPanelId = 'panel' + data.Id;
        let requestButton = document.getElementById(requestButtonId);
        let requestPanel = document.getElementById(requestPanelId);
        if (requestPanel != null) {

            //element already exists, so response received.
            requestPanel.innerHTML += `<h3>Response ( ${data.DurationMs} )</h3><div><h4>Headers</h4>${getHeaders(data.Response)}</div>`;
            requestButton.innerHTML += '<span class="right-text">' + data.Response.StatusCode +  '(' +  data.Response.ReasonPhrase + ') ' + data.DurationMs + 'ms</span>';
        }
        else {
            //accordion button
            requestButton = document.createElement('button');
            requestButton.className = 'accordion';
            requestButton.setAttribute('id', requestButtonId);
            requestButton.innerHTML = '<span class="left-text">' + data.Id + ': ' + data.Request.Method.Method + ' ' + data.Request.RequestUri + '</span>';
            requestButton.addEventListener('click', function () { accordionButtonClick(requestButton, requestPanelId); });
            outputContainer.appendChild(requestButton);

            //accordion panel
            requestPanel = document.createElement('div');
            requestPanel.setAttribute('id', requestPanelId);
            requestPanel.className = 'panel';
            requestPanel.innerHTML = `<h3>Request:</h3><div><h4>Headers</h4>${getHeaders(data.Request)}</div>`;
            outputContainer.appendChild(requestPanel);

        }

    }
    else if (Object.hasOwn(data, 'FunctionName')) 
    {
            //function invocation
            const textDiv = document.createElement('div');
            let durationText = '';
            if (data.Invocation == 'End'){ 
                durationText = ' - #' + data.TotalRequests + ' Total: ' + data.TotalRequestDurationMs + 'ms. Avg: ' + data.AvgRequestDurationMs + 'ms. Function: ' + data.TotalDurationMs + 'ms.';
            }
            
            textDiv.innerHTML = '<h4>[' + data.Invocation + '] '+ data.FunctionName +  ' (' + data.Annotation + durationText + ')</h4>'
            outputContainer.appendChild(textDiv);
    }
    else if (Object.hasOwn(data, 'Passed')) 
        {
                //assertions
                const textDiv = document.createElement('div');
                const passedText = data.Passed ? '<span class="passed">PASSED</span>' : '<span class="failed">FAILED</span>';
                const description = data.Description ? (' (' + data.Description + ')') : '';
                
                textDiv.innerHTML = '<h4>' + passedText + ' ' + data.ExpressionText + description + '</h4>'
                outputContainer.appendChild(textDiv);
        }
    else {
        //text output
        const textDiv = document.createElement('div');
        textDiv.innerHTML = '<h4>' + JSON.stringify(data, null, 2) + '</h4>'
        outputContainer.appendChild(textDiv);

    }

});

function accordionButtonClick(button, panelId) {
    console.log('In click!');
    button.classList.toggle("active");
    const panel = document.getElementById(panelId);
    if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
    } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
    }
}

function getHeaders(data){
    var headers = "<table><th>Key</th><th>Value</th>";

    for(var i=0; i< data.Headers.length; i++){
        const header = data.Headers[i];
        headers += `<tr><td>${header.Key}</td><td>${header.Value}</td></tr>`;
    }
    headers += '</table>';
    return headers;
}