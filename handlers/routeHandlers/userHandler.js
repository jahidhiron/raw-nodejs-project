// dependencies
const data = require("../../lib/data");
const { hash, parseJSON } = require("../../helpers/utilities");
const tokenHandler = require("./tokenHandler");

// handler object - module scaffolding
const handler = {};

handler.userHandler = (requestProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];

  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handler._user[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }
};

// making another scaffolding
handler._user = {};

// get request
handler._user.get = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.queryStringObj.phone === "string"
      ? requestProperties.queryStringObj.phone
      : false;

  const token =
    typeof requestProperties.headerObj.token === "string"
      ? requestProperties.headerObj.token
      : false;

  if (phone) {
    // first verify token
    tokenHandler._token.verify(token, phone, (status) => {
      if (status) {
        // if token is verified the fetch user data
        data.read("users", phone, (error, data) => {
          const user = { ...parseJSON(data) };

          if (!error && user) {
            delete user.password;
            callback(200, user);
          } else {
            callback(404, {
              message: "User was not found !",
            });
          }
        });
      } else {
        callback(403, {
          message: "Autentication failure",
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
handler._user.post = (requestProperties, callback) => {
  const { firstName, lastName, phone, password, toSAggrement } = validation(
    requestProperties.body
  );
  if (firstName && lastName && phone && password && toSAggrement) {
    data.read("users", phone, (error, user) => {
      if (error) {
        let userObj = {
          firstName,
          lastName,
          phone,
          password: hash(password),
          toSAggrement,
        };

        data.create("users", phone, userObj, (error) => {
          callback(200, {
            message: "User created successfully",
          });
        });
      } else {
        callback(500, {
          message: "User already exist",
        });
      }
    });
  }
};

// put request
handler._user.put = (requestProperties, callback) => {
  const { firstName, lastName, phone, password, toSAggrement } = validation(
    requestProperties.body
  );

  const token =
    typeof requestProperties.headerObj.token === "string"
      ? requestProperties.headerObj.token
      : false;

  if (phone) {
    // first verify the token
    tokenHandler._token.verify(token, phone, (status) => {
      if (status) {
        // firstName or lastName or password anyone must exist
        if (firstName || lastName || password) {
          // first lookup user
          data.read("users", phone, (error1, userData) => {
            let user = { ...parseJSON(userData) };
            if (!error1 && user) {
              if (firstName) {
                user.firstName = firstName;
              }
              if (lastName) {
                user.lastName = lastName;
              }
              if (password) {
                user.password = hash(password);
              }

              // update user
              data.update("users", phone, user, (error2) => {
                if (!error2) {
                  callback(200, {
                    message: "user was updated successfully",
                  });
                } else {
                  callback(400, {
                    message: "Server side error",
                  });
                }
              });
            } else {
              callback(400, {
                message: "Phone number does not match",
              });
            }
          });
        } else {
          callback(400, {
            message: "Wrong input",
          });
        }
      } else {
        callback(403, {
          message: "Autentication failure",
        });
      }
    });
  }
};

// delete request
handler._user.delete = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.queryStringObj.phone === "string"
      ? requestProperties.queryStringObj.phone
      : false;

  const token =
    typeof requestProperties.headerObj.token === "string"
      ? requestProperties.headerObj.token
      : false;

  if (phone) {
    tokenHandler._token.verify(token, phone, (status) => {
      if (status) {
        // if token is verified the fetch user data
        data.read("users", phone, (error1, userData) => {
          if (!error1 && userData) {
            data.delete("users", phone, (error2) => {
              if (!error2) {
                callback(200, {
                  message: "User was deleted successfully",
                });
              } else {
                callback(500, {
                  message: "Server side error",
                });
              }
            });
          } else {
            callback(400, {
              message: "wrong input",
            });
          }
        });
      } else {
        callback(403, {
          message: "Autentication failure",
        });
      }
    });
  } else {
    callback(400, {
      message: "Empty phone number",
    });
  }
};

// user validation
const validation = ({ firstName, lastName, phone, password, toSAggrement }) => {
  firstName =
    typeof firstName === "string" && firstName.trim().length > 2
      ? firstName
      : false;
  lastName =
    typeof lastName === "string" && lastName.trim().length > 2
      ? lastName
      : false;
  phone = phone.match(/^\+?(88)?0?1[3456789][0-9]{8}\b/) ? phone : false;
  password =
    typeof password === "string" && password.trim().length > 3
      ? password
      : false;
  toSAggrement = typeof toSAggrement === "boolean" ? toSAggrement : false;

  return {
    firstName,
    lastName,
    phone,
    password,
    toSAggrement,
  };
};

// export module
module.exports = handler;
