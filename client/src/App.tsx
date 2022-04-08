import { useState } from "react";
import "./App.css";
import logo from "./logo.svg";

function App() {
  const [filename, setFilename] = useState<null | string>(null);
  const generatePdf = async () => {
    const response = await fetch("/api/generate-pdf");
    const json: { filename: string } = await response.json();

    setFilename(json.filename);
  };

  const downloadPdfDirectly = async () => {
    const response = await fetch("/api/generate-pdf?download=1");
    const blob = await response.blob();

    console.log("response header list:");

    for (var pair of response.headers.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    const contentType = response.headers.get("content-type");
    const contentDisposition = response.headers.get("content-disposition");

    console.log("check content-type", contentType, blob.type);

    if (contentDisposition) {
      const filename = contentDisposition.substring(
        contentDisposition.indexOf('"') + 1,
        contentDisposition.lastIndexOf('"')
      );

      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      link.click();

      URL.revokeObjectURL(link.href);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <div>
        <button onClick={generatePdf}>generate pdf</button>
        <div></div>
        {filename && (
          <a href={"/api/download-file/" + filename} download={filename}>
            download {filename}
          </a>
        )}
        <div></div>
        <button onClick={downloadPdfDirectly}>download pdf directly</button>
      </div>
    </div>
  );
}

export default App;
