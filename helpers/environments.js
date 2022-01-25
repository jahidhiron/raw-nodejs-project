// environment obj - module scaffolding
const environment = {};

environment.staging = {
  port: 3000,
  envName: "staging",
  secretKey: "huidhgiuduidsguid",
  maxChecks: 5,
  twilio: {
    fromPhone: "+15005550006",
    accountSid: "AC1e2f5f3135d951ee2519795247deb8fa",
    authToken: "b63e2c6a29992002ecbff4cf72ece152",
  },
};

environment.production = {
  port: 4000,
  envName: "production",
  secretKey: "huhdhuihadigdsaiu",
  maxChecks: 5,
  twilio: {
    fromPhone: "+15005550006",
    accountSid: "AC1e2f5f3135d951ee2519795247deb8fa",
    authToken: "b63e2c6a29992002ecbff4cf72ece152",
  },
};

const currentEnv =
  typeof process.env.NODE_ENV === "string" ? process.env.NODE_ENV : "staging";
const envToExport =
  typeof environment[currentEnv] === "object"
    ? environment[currentEnv]
    : environment.staging;

// module export
module.exports = envToExport;
