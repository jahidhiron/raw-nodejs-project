// dependencies
const server = require("./lib/server");
const workers = require("./lib/workers");

// app object - module scaffolding
const app = {};

app.init = () => {
  // start server
  server.init();

  // start workers
  workers.init();
};

app.init();

// export module
module.exports = app;
