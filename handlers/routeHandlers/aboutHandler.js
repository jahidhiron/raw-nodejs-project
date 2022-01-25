// handler object - module scaffolding
const handler = {};

handler.aboutHandler = (requestProperties, callback) => {
  callback(200, {
    message: "This is about handler",
  });
};

// export module
module.exports = handler;
