document.getElementById('send-element').addEventListener('click', async () => {
    const name = document.getElementById('name').value;
    const html = document.getElementById('html').value;
    if (html) {
        document.getElementById('html').value = '';
        chrome.runtime.sendMessage({
            action: 'sendElement',
            element: html,
            name: name
        });
        return;
    }

    chrome.devtools.inspectedWindow.eval(
        "inspect($0); $0.outerHTML;", // `$0` is the currently selected element in DevTools
        (result, isException) => {
            if (isException) {
                console.error("Error evaluating the selected element:", isException);
                return;
            }

            chrome.runtime.sendMessage({
                action: 'sendElement',
                element: result,
                name: name
            });
        }
    );
});
