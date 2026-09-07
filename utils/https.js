const fs = require("fs");
const https = require("https");

const options = {
    key: fs.readFileSync("./ssl/key.pem"),
    cert: fs.readFileSync("./ssl/cert.pem")
};

module.exports = server => https.createServer(options, server);