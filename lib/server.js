/*
 * Title: Server library
 * Description: Server related files
 * Author: Jahid Hiron
 * Date: 12/31/2021
 *
 */
// dependencies
const http = require("http");
const { handleReqRes } = require("../helpers/handleReqRes");
const env = require("../helpers/environments");

// server object - module scaffolding
const server = {};

// configuration
server.config = {
  port: env.port,
};

// create server
server.createServer = () => {
  const newServer = http.createServer(server.handleReqRes);
  newServer.listen(server.config.port, () => {
    console.log(`listening to port ${server.config.port}`);
  });
};

// handle Request Response
server.handleReqRes = handleReqRes;

// start the server
server.init = () => {
  server.createServer();
};

// export
module.exports = server;
