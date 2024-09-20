document.getElementById('send-element').addEventListener('click', async () => {
    chrome.devtools.inspectedWindow.eval(
        "inspect($0); $0.outerHTML;", // `$0` is the currently selected element in DevTools
        (result, isException) => {
            if (isException) {
                console.error("Error evaluating the selected element:", isException);
                return;
            }

            const name = document.getElementById('name').value;

            // Send a message to background.js
            chrome.runtime.sendMessage({
                action: 'sendElement',
                element: result,
                name: name
            });
        }
    );
});
