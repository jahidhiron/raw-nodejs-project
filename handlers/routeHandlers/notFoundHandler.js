// handler object - module scaffolding
const handler = {};

handler.notFoundHandler = (requestProperties, callback) => {
  callback(404, {
    message: "Your requested URL is not found",
  });
};

// export module
module.exports = handler;
