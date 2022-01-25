// dependencies
const data = require("../../lib/data");
const {
  hash,
  createRandomString,
  parseJSON,
} = require("../../helpers/utilities");

// handler object - module scaffolding
const handler = {};

handler.tokenHandler = (requestProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];

  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handler._token[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }
};

// another scaffolding
handler._token = {};

// get request
handler._token.get = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.queryStringObj.phone === "string"
      ? requestProperties.queryStringObj.phone
      : false;

  if (phone) {
    data.read("tokens", phone, (error, tokenData) => {
      const token = { ...parseJSON(tokenData) };

      if (!error && token) {
        callback(200, token);
      } else {
        callback(404, {
          message: "Token was not found !",
        });
      }
    });
  } else {
    callback(404, {
      message: "Invalid phone number",
    });
  }
};

// post request
handler._token.post = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.body.phone === "string"
      ? requestProperties.body.phone
      : false;

  const password =
    typeof requestProperties.body.password === "string" &&
    requestProperties.body.password.trim().length > 0
      ? requestProperties.body.password
      : false;

  if (phone && password) {
    // read user details if phone number is matched
    data.read("users", phone, (error1, userData) => {
      let user = { ...parseJSON(userData) };
      if (!error1 && userData) {
        const hashedPassword = hash(password);
        if (hashedPassword === user.password) {
          const tokenId = createRandomString(20);
          const expires = Date.now() + 60 * 60 * 1000;
          const tokenObj = {
            phone,
            tokenId,
            expires,
          };

          // store token to fs
          data.create("tokens", phone, tokenObj, (error2) => {
            if (!error2) {
              callback(200, {
                message: "Token is created successfully",
              });
            } else {
              console.log(error2);
              callback(200, {
                message: "Internal server error",
              });
            }
          });
        }
      } else {
        callback(400, {
          message: "username or password does not match",
        });
      }
    });
  }
};

// put request
handler._token.put = (requestProperties, callback) => {
  let { phone, extend } = requestProperties.body;
  phone = typeof phone === "string" ? phone : false;
  extend = typeof extend === "boolean" && extend === true ? extend : false;

  if (phone && extend) {
    data.read("tokens", phone, (error1, tokenData) => {
      if (!error1 && tokenData) {
        let tokenObj = { ...parseJSON(tokenData) };
        if (tokenObj.expires > Date.now()) {
          tokenObj.expires = Date.now() * 60 * 60 * 1000;
          data.update("tokens", phone, tokenObj, (error2) => {
            if (!error2) {
              callback(200, {
                message: "Token successfully updated",
              });
            } else {
              callback(500, {
                message: "Server side error",
              });
              console.log(error2);
            }
          });
        }
      } else {
        callback(500, {
          message: "There is a problem in your request",
        });
      }
    });
  } else {
    callback(400, {
      message: "There is a problem in your request",
    });
  }
};

// delete request
handler._token.delete = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.queryStringObj.phone === "string"
      ? requestProperties.queryStringObj.phone
      : false;

  if (phone) {
    data.read("tokens", phone, (error1, tokenData) => {
      if (!error1 && tokenData) {
        data.delete("tokens", phone, (error2) => {
          if (!error2) {
            callback(200, {
              message: "Token was deleted successfully",
            });
          } else {
            callback(500, {
              message: "Server side error",
            });
          }
        });
      } else {
        callback(400, {
          message: "There is a problem in your request",
        });
      }
    });
  } else {
    callback(400, {
      message: "There is a problem in your request",
    });
  }
};

// verify token
handler._token.verify = (token, phone, callback) => {
  phone = typeof phone === "string" ? phone : false;
  token = typeof token === "string" ? token : false;

  if (phone) {
    data.read("tokens", phone, (error, tokenData) => {
      if (!error && tokenData) {
        currentToken = { ...parseJSON(tokenData) };
        if (
          currentToken.tokenId === token &&
          currentToken.expires > Date.now()
        ) {
          callback(true);
        } else {
          callback(false);
        }
      } else {
        callback(false);
      }
    });
  } else {
    console.log("I am here");
    callback(false);
  }
};

// export module
module.exports = handler;
