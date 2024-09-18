package html2

var js = `
function uploadFile() {
	const fileInput = document.getElementById('fileInput');
	if (!fileInput.files.length) return;

	const file = fileInput.files[0];
	const ws = new WebSocket('ws://' + window.location.host + '/upload');

	ws.onopen = function() {
		// Send the file name to the server
		ws.send(file.name);

		// Read the file as an ArrayBuffer and send it over the WebSocket
		const reader = new FileReader();
		reader.onload = function(event) {
			const buffer = event.target.result;
			ws.send(buffer);
		};
		reader.readAsArrayBuffer(file);
	};

	ws.onmessage = function(event) {
		// Close the WebSocket connection
		ws.close();

		// Create a message element
		const messageElement = document.createElement('p');
		messageElement.textContent = "File uploaded successfully!";

		// Create a link element
		const linkElement = document.createElement('a');
		linkElement.href = '/files/' + file.name; // Assuming the file is accessible under /files/
		linkElement.textContent = "Click here to view the file";
		linkElement.target = "_blank"; // Open in a new tab

		// Append the message and link to the body or another container
		const body = document.querySelector('body');
		body.appendChild(messageElement);
		body.appendChild(linkElement);
	};

	ws.onerror = function(error) {
		alert("WebSocket error: " + error.message);
	};
}
`

func Upload() *Node {
	_ = Div(
		Button(Attr("onclick", "uploadFile()"), T("Upload")),
		Script(T(js)),
	)
	return Html(
		Attrs(map[string]string{"lang": "en"}),
		Head(
			Meta(Attrs(map[string]string{"charset": "UTF-8"})),
			Title(T("File Upload")),
		),
		Body(
			H1(T("Upload a File")),
			Form(Method("POST"), Action("/upload"), Attr("enctype", "multipart/form-data"),
				Input(Type("file"), Id("file"), Name("file"), Attr("required", "true")),
				Button(Type("submit"), T("Submit")),
			),
		),
	)
}
