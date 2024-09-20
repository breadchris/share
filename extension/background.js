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
    if (message.action === 'sendElement') {
        const { element, name } = message;

        // Send the data to the server
        fetch('http://localhost:8080/extension', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ element, name })
        })
            .then(response => {
                if (response.ok) {
                    console.log('Element sent successfully!');
                } else {
                    console.error('Failed to send element.');
                }
            })
            .catch(error => {
                console.error('Error while sending element:', error);
            });
    }
});
