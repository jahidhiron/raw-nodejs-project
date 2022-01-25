// dependencies
const { createHmac } = require("crypto");
const environment = require("./environments");

// utilities object - module scaffolding
const utilities = {};

// json stringify
utilities.parseJSON = (jsonString) => {
  let output = {};

  try {
    output = JSON.parse(jsonString);
  } catch (error) {
    output = {};
    console.log(error);
  }
  return output;
};

// hash string
utilities.hash = (str) => {
  if (typeof str === "string" && str.length > 2) {
    const hash = createHmac("sha256", environment.secretKey)
      .update(str)
      .digest("hex");
    return hash;
  }
  return false;
};

// create a random string
utilities.createRandomString = (strLength) => {
  let length = strLength;
  length = typeof strLength === "number" ? length : false;

  if (length) {
    const possibleChar =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let output = "";
    for (let i = 0; i < length; i += 1) {
      const randomChar = possibleChar.charAt(
        Math.floor(Math.random() * possibleChar.length)
      );
      output += randomChar;
    }
    return output;
  }
  return false;
};

// module export
module.exports = utilities;
