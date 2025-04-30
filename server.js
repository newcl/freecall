const express = require("express");
const { ExpressPeerServer } = require("peer");
const http = require("http");

const app = express();
const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);

app.use(express.static("public")); // Serve frontend

const PORT = 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});