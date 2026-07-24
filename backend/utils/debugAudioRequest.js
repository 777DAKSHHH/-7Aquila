import https from "https";

console.log("Analyzing audio URL...");
const url = "https://l-hit-aged7aquila.onrender.com/uploads/audio/c20_t1_p1.mp3";

https.get(url, (res) => {
  console.log("HTTP Status:", res.statusCode);
  console.log("Headers:", res.headers);

  let dataChunks = [];
  res.on("data", (chunk) => {
    dataChunks.push(chunk);
    // Print first chunk info
    if (dataChunks.length === 1) {
      console.log("First Chunk Length:", chunk.length);
      console.log("First Chunk Bytes (Hex):", chunk.slice(0, 16).toString("hex"));
      console.log("First Chunk Bytes (Text):", chunk.slice(0, 100).toString("ascii").replace(/[^\x20-\x7E]/g, '.'));
    }
  });

  res.on("end", () => {
    const totalBytes = dataChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    console.log("Total Bytes Received:", totalBytes);
  });
}).on("error", (err) => {
  console.error("Request failed:", err.message);
});
