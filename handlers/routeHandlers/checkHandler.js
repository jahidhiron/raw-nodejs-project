// dependencies
const data = require("../../lib/data");
const { parseJSON, createRandomString } = require("../../helpers/utilities");
const { _token } = require("./tokenHandler");
const { maxChecks } = require("../../helpers/environments");

// handler object - module scaffolding
const handler = {};

handler.checkHandler = (requestProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];

  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handler._check[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }
};

// making another scaffolding
handler._check = {};

// get request
handler._check.get = (requestProperties, callback) => {
  const checkId =
    typeof requestProperties.queryStringObj.id === "string"
      ? requestProperties.queryStringObj.id
      : false;

  if (checkId) {
    data.read("checks", checkId, (error1, checkData) => {
      if (!error1 && checkData) {
        const phone =
          typeof requestProperties.headerObj.phone === "string"
            ? requestProperties.headerObj.phone
            : false;
        if (phone) {
          data.read("tokens", phone, (error2, tokenData) => {
            if (!error2 && tokenData) {
              token = { ...parseJSON(tokenData) }.tokenId;
              if (token) {
                _token.verify(token, phone, (status) => {
                  if (status) {
                    const check = { ...parseJSON(checkData) };
                    callback(200, check);
                  } else {
                    callback(403, {
                      message: "Authentication fail",
                    });
                  }
                });
              } else {
                callback(500, {
                  message: "Server side error",
                });
              }
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
};

// post request
handler._check.post = (requestProperties, callback) => {
  // validation
  let { protocol, url, method, successCodes, timeoutSeconds } = validation(
    requestProperties.body
  );

  if (protocol && url && method && successCodes && timeoutSeconds) {
    const phone =
      typeof requestProperties.headerObj.phone === "string"
        ? requestProperties.headerObj.phone
        : false;

    // lookup token by reading phone
    data.read("tokens", phone, (error1, tokenData) => {
      if (!error1 && tokenData) {
        let tokenId = { ...parseJSON(tokenData) }.tokenId;
        data.read("users", phone, (error2, userData) => {
          if (!error2 && userData) {
            _token.verify(tokenId, phone, (status) => {
              if (status) {
                let user = { ...parseJSON(userData) };
                let userCheck =
                  typeof user.checks === "object" &&
                  user.checks instanceof Array
                    ? user.checks
                    : [];

                if (userCheck.length < maxChecks) {
                  const checkId = createRandomString(20);

                  const checkObj = {
                    checkId,
                    phone,
                    protocol,
                    url,
                    method,
                    successCodes,
                    timeoutSeconds,
                  };

                  data.create("checks", checkId, checkObj, (error3) => {
                    if (!error3) {
                      user.checks = userCheck;
                      user.checks.push(checkId);

                      data.update("users", phone, user, (error4) => {
                        if (!error4) {
                          callback(200, {
                            message: "Check was created successfully",
                          });
                        } else {
                          console.log(error4);
                          callback(500, {
                            message: "Server side error",
                          });
                        }
                      });
                    } else {
                      callback(500, {
                        message: "Server side error",
                      });
                    }
                  });
                } else {
                  callback(401, {
                    message: "User has already reached max check limit",
                  });
                }
              } else {
                callback(403, {
                  message: "Authentication failure",
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
    });
  } else {
    callback(400, {
      message: "There is a problem in your request",
    });
  }
};

// put request
handler._check.put = (requestProperties, callback) => {
  const checkId =
    typeof requestProperties.body.checkId === "string"
      ? requestProperties.body.checkId
      : false;

  if (checkId) {
    let { protocol, url, method, successCodes, timeoutSeconds } = validation(
      requestProperties.body
    );
    if (protocol || url || method || successCodes || timeoutSeconds) {
      const phone =
        typeof requestProperties.headerObj.phone === "string"
          ? requestProperties.headerObj.phone
          : false;

      if (phone) {
        data.read("tokens", phone, (error1, tokenData) => {
          if (!error1 && tokenData) {
            _token.verify(token, phone, (status) => {
              if (status) {
                data.read("checks", checkId, (error2, checkData) => {
                  if (!error2 && checkData) {
                    let check = { ...parseJSON(checkData) };
                    if (protocol) check.protocol = protocol;
                    if (url) check.url = url;
                    if (method) check.method = method;
                    if (successCodes) check.successCodes = successCodes;
                    if (timeoutSeconds) check.timeoutSeconds = timeoutSeconds;

                    data.update("checks", checkId, check, (error3) => {
                      if (!error3) {
                        callback(200, {
                          message: "Check data is updated successfully",
                        });
                      } else {
                        callback(500, {
                          message: "Server side error",
                        });
                      }
                    });
                  } else {
                    callback(500, {
                      message: "Server side error",
                    });
                  }
                });
              } else {
                callback(403, {
                  message: "Authentication fail",
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
    } else {
      callback(400, {
        message: "There is a problem in your request",
      });
    }
  } else {
    callback(400, {
      message: "There is a problem in your request",
    });
  }
};

// delete request
handler._check.delete = (requestProperties, callback) => {
  const checkId =
    typeof requestProperties.queryStringObj.id === "string"
      ? requestProperties.queryStringObj.id
      : false;

  if (checkId) {
    data.read("checks", checkId, (error1, checkData) => {
      if (!error1 && checkData) {
        check = { ...parseJSON(checkData) };
        const phone = check.phone;
        if (phone) {
          data.read("tokens", phone, (error2, tokenData) => {
            if (!error2 && tokenData) {
              const token = { ...parseJSON(tokenData) }.tokenId;
              _token.verify(token, phone, (status) => {
                if (status) {
                  data.delete("checks", checkId, (error3) => {
                    if (!error3) {
                      data.read("users", phone, (error4, userData) => {
                        if (!error4 && userData) {
                          let user = { ...parseJSON(userData) };
                          let userCheck =
                            typeof user.checks === "object" &&
                            user.checks instanceof Array
                              ? user.checks
                              : [];
                          let checkPosition = userCheck.indexOf(checkId);
                          if (checkPosition > -1) {
                            userCheck.splice(checkPosition, 1);
                            user.checks = userCheck;
                            data.update("users", phone, user, (error5) => {
                              if (!error5) {
                                callback(200, {
                                  message: "Check is deleted successfully",
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
                        } else {
                          callback(500, {
                            message: "Server side problem",
                          });
                        }
                      });
                    } else {
                      callback(500, {
                        message: "Server side error",
                      });
                    }
                  });
                } else {
                  callback(403, {
                    message: "Authentication failure",
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
};

// validation
const validation = ({
  protocol,
  url,
  method,
  successCodes,
  timeoutSeconds,
}) => {
  protocol =
    typeof protocol === "string" && ["http", "https"].indexOf(protocol) > -1
      ? protocol
      : false;
  url = typeof url === "string" && url.trim().length > 0 ? url : false;
  method =
    typeof method === "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(method) > -1
      ? method
      : false;
  successCodes =
    typeof successCodes === "object" && successCodes instanceof Array
      ? successCodes
      : false;
  timeoutSeconds =
    typeof timeoutSeconds === "number" &&
    timeoutSeconds % 1 === 0 &&
    timeoutSeconds >= 1 &&
    timeoutSeconds <= 5
      ? timeoutSeconds
      : false;

  return {
    protocol,
    url,
    method,
    successCodes,
    timeoutSeconds,
  };
};

// export module
module.exports = handler;
