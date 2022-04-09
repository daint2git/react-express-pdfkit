import { useRef, useState } from "react";
import "./App.css";
import logo from "./logo.svg";

function App() {
  const [filename, setFilename] = useState<null | string>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const downloadPdfProgress = async () => {
    abortControllerRef.current = new AbortController();
    abortControllerRef.current.signal.addEventListener("abort", (data) => {
      console.log("abort", data);
    });

    const response = await fetch("/api/download-pdf-progress", {
      signal: abortControllerRef.current.signal,
    });
    const percent = document.getElementById(
      "downloadedPercent"
    ) as HTMLProgressElement;

    if (!percent) return;

    percent.value = 0;
    percent.innerHTML = "0%";

    if (!response.body) return;
    const reader = response.body.getReader();
    const contentLength = response.headers.get("Content-Length");
    const contentType = response.headers.get("content-type");
    const contentDisposition = response.headers.get("content-disposition");

    if (!contentLength || !contentType || !contentDisposition) return;

    const filename = contentDisposition.substring(
      contentDisposition.indexOf('"') + 1,
      contentDisposition.lastIndexOf('"')
    );

    let receivedLength = 0; // received that many bytes at the moment
    const chunks = []; // array of received binary chunks (comprises the body)

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        break;
      }

      chunks.push(value);
      receivedLength += value.length;

      console.log(`Received ${receivedLength} of ${contentLength}`);

      const nextPercent = Math.floor((receivedLength / +contentLength) * 100);
      console.log("nextPercent", nextPercent);

      percent.value = nextPercent;
      percent.innerHTML = nextPercent + "%";
    }

    const blob = new Blob(chunks);

    const link = document.createElement("a");
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();

    URL.revokeObjectURL(link.href);
  };

  const cancelDownloadPdfProgress = () => {
    abortControllerRef.current?.abort();
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
        <br />
        <button onClick={downloadPdfDirectly}>download pdf directly</button>
        <div></div>
        <br />
        <button onClick={downloadPdfProgress}>download pdf progress</button>
        <br />
        <progress id="downloadedPercent" value="0" max="100">
          0
        </progress>
        <br />
        <button onClick={cancelDownloadPdfProgress}>cancel download</button>
      </div>
    </div>
  );
}

export default App;
