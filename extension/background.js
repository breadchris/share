// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "modifyClass") {
        (async () => {
            const { class: className, dataGodom } = message;

            // Send the data to localhost:8080/modify
            fetch('http://localhost:8080/modify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    class: className,
                    dataGodom: dataGodom
                })
            })
                .then(data => console.log('Success:', data))
                .catch((error) => console.error('Error:', error));
        })();
    }
});
