// dependencies
const url = require("url");
const { StringDecoder } = require("string_decoder");
const routes = require("../routes");
const {
  notFoundHandler,
} = require("../handlers/routeHandlers/notFoundHandler");
const { parseJSON } = require("../helpers/utilities");

// handler object - module scaffolding
const handler = {};

// handle request and response
handler.handleReqRes = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, "");
  const method = req.method.toLowerCase();
  const queryStringObj = parsedUrl.query;
  const headerObj = req.headers;

  const requestProperties = {
    parsedUrl,
    trimmedPath,
    method,
    queryStringObj,
    headerObj,
  };

  const chosenHandler = routes[trimmedPath]
    ? routes[trimmedPath]
    : notFoundHandler;

  // reaquest body
  const decoder = new StringDecoder("utf-8");
  let realData = "";
  req.on("data", (buffeer) => {
    realData += decoder.write(buffeer);
  });

  req.on("end", () => {
    realData += decoder.end();
    requestProperties.body = parseJSON(realData);

    chosenHandler(requestProperties, (statusCode, payload) => {
      statusCode = typeof statusCode === "number" ? statusCode : 500;
      payload = typeof payload === "object" ? payload : {};

      const payloadString = JSON.stringify(payload);

      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
};

// export module
module.exports = handler;
