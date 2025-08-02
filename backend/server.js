const express = require("express");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const twilio = require("twilio");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer();

// Twilio credentials
const accountSid = "";
const authToken = "";
const client = twilio(accountSid, authToken);
const TWILIO_WHATSAPP = "whatsapp:+14155238886"; // Twilio Sandbox number

// Main endpoint
app.post("/generate-and-send", upload.none(), async (req, res) => {
  console.log("Received request:", req.body);
  const {
    businessName,
    gstin,
    businessAddress,
    receiptNumber,
    customerName,
    customerPhone,
    customerAddress,
    notes,
  } = req.body;
  const filename = `${customerName?.split(" ")[0]}_${uuidv4()}_.pdf`;
  const filepath = path.join(__dirname, filename);
  
  try {
    // Step 1: Generate PDF
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    doc.fontSize(20).text("Receipt", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(14)
      .text(`Bussiness: ${businessName}` || "No message provided");
    doc.moveDown();
    doc.fontSize(14).text(gstin || "No message provided");
    doc.moveDown();
    doc.fontSize(14).text(businessAddress || "No message provided");
    doc.moveDown();
    doc.fontSize(14).text(receiptNumber || "No message provided");
    doc.moveDown();
    doc.fontSize(14).text(customerName || "No message provided");
    doc.moveDown();
    doc.fontSize(14).text(customerPhone || "No message provided");
    doc.moveDown();
    doc.fontSize(14).text(customerAddress || "No message provided");
    doc.moveDown();
    doc.fontSize(14).text(notes || "No message provided");
    doc.end();

    await new Promise((resolve) => stream.on("finish", resolve));

    // Step 2: Upload PDF to file.io
    const fileStream = fs.createReadStream(filepath);
    const FormData = require("form-data");
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filepath));

    const uploadRes = await axios.post(
      "https://tmpfiles.org/api/v1/upload",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    const rawUrl = uploadRes.data.data.url;
    const fileId = rawUrl.split("/")[3]; // '8499799'
    const filename = rawUrl.split("/")[4]; // 'abc123.pdf'
    const fileUrl = `https://tmpfiles.org/dl/${fileId}/${filename}`;
    console.log(fileUrl);
    if (!fileUrl) throw new Error("Upload failed");

    // Step 3: Send WhatsApp message
    const messageResult = await client.messages.create({
      from: TWILIO_WHATSAPP,
      to: `whatsapp:${customerPhone}`,
      body: "Here is your PDF message!",
      mediaUrl: [fileUrl],
    });

    // const messageResult = await client.messages.create({
    //   from: TWILIO_WHATSAPP,
    //   to: `whatsapp:${customerPhone}`,
    //   contentSid: accountSid, // Replace with real Template SID from Twilio Console
    //   contentVariables: JSON.stringify({
    //     1: customerName || "Customer",
    //     2: fileUrl,
    //   }),
    // });

    res.json({ success: true, sid: messageResult.sid, fileUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // fs.unlink(filepath, () => {}); // delete temp PDF
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
