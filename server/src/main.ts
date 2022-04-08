import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.status(200).send({ message: "Root route" });
});

app.get("/api/generate-pdf", (req, res) => {
  const { download } = req.query;
  const doc = new PDFDocument();

  const filename = path.resolve(process.cwd(), "output/pdf-file.pdf");
  const stream = fs.createWriteStream(filename);

  // Add an image, constrain it to a given size, and center it vertically and horizontally
  doc.image(path.resolve(process.cwd(), "assets/flower.jpeg"), {
    fit: [250, 300],
    align: "center",
    valign: "center",
  });

  doc.addPage().fontSize(25).text("Here is some vector graphics...", 100, 100);

  // Draw a triangle
  doc.save().moveTo(100, 150).lineTo(100, 250).lineTo(200, 250).fill("#FF3300");

  // Apply some transforms and render an SVG path with the 'even-odd' fill rule
  doc
    .scale(0.6)
    .translate(470, -380)
    .path("M 250,75 L 323,301 131,161 369,161 177,301 z")
    .fill("red", "even-odd")
    .restore();

  // Add some text with annotations
  doc
    .addPage()
    .fillColor("blue")
    .text("Here is a link!", 100, 100)
    .underline(100, 100, 160, 27, { color: "#0000FF" })
    .link(100, 100, 160, 27, "http://google.com/");

  doc.pipe(stream);

  // Finalize PDF file
  doc.end();

  stream.on("finish", () => {
    console.log("stream finished");

    if (download) {
      res
        .set({
          "Access-Control-Expose-Headers": "Content-Disposition",
        })
        .download(filename);
    } else {
      res.json({
        message: "generated pdf file",
        filename: "pdf-file.pdf",
      });
    }
  });
});

app.get("/api/download-file/:filename", (req, res) => {
  const { filename } = req.params;
  const outputPath = path.resolve(process.cwd(), "output");
  res.sendFile(outputPath + "/" + filename);
});

app.listen(4000, () => console.log("app running on port 4000"));
