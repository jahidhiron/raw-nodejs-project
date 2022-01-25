// dependencies
const url = require("url");
const http = require("http");
const https = require("https");
const data = require("./data");
const { parseJSON } = require("../helpers/utilities");
const { sendTwilioSms } = require("../helpers/notification");

// worker object - module scaffolding
const worker = {};

// alert user
worker.alertUserToStatusChange = (checkData) => {
  let copyCheckData = checkData;
  const msg = `Alert: Your check for ${copyCheckData.method.toUpperCase()} ${
    copyCheckData.protocol
  }://${copyCheckData.url} is currently ${copyCheckData.state}`;

  console.log(msg);

  //   sendTwilioSms(copyCheckData.phone, msg, (error) => {
  //     if (!error) {
  //       console.log(`User was alerted to a stutus change via SMS ${msg}`);
  //     } else {
  //       console.log("There is a problem to send SMS");
  //     }
  //   });
};

// process outcome function
worker.processCheckOutcome = (checkData, checkOutcome) => {
  let copyCheckData = checkData;

  const state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    copyCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1
      ? "up"
      : "down";

  // descide whether we should alert the user or not
  const alertWanted = !!(
    copyCheckData.lastChecked && copyCheckData.state !== state
  );
  // equvalant to
  //   const alertWanted = copyCheckData.lastChecked && copyCheckData !== state ? true : false;

  copyCheckData.state = state;
  copyCheckData.lastChecked = Date.now();

  //   update the check data
  data.update("checks", copyCheckData.checkId, copyCheckData, (error) => {
    if (!error) {
      if (alertWanted) {
        worker.alertUserToStatusChange(copyCheckData);
      } else {
        console.log("There is no status change");
      }
    } else {
      console.lop("Error: to update check data");
    }
  });
};

worker.performCheck = (checkData) => {
  let copyCheckData = checkData;

  //   prepare the intial outcome
  let checkOutcome = {
    error: false,
    responseCode: false,
  };

  //   mark the outcome has not been sent yet
  let outcomeSent = false;

  // parse url
  const parsedUrl = url.parse(
    `${copyCheckData.protocol}://${copyCheckData.url}`,
    true
  );

  //   hostname and path [note: path->with querystring pathname->without querystring]
  const { hostname, path } = parsedUrl;

  //   construct request object
  const requestObject = {
    protocol: `${copyCheckData.protocol}:`,
    hostname,
    method: copyCheckData.method.toUpperCase(),
    path,
    tmeout: copyCheckData.timeoutSeconds * 1000,
  };

  const protocolToUse = copyCheckData.protocol === "http" ? http : https;

  //   here there case: req, error, timeout. they can occur individually or both.
  // like individually req or error or timeout. or both req or error. or boht req or timeout may meet
  let req = protocolToUse.request(requestObject, (res) => {
    //   grab the status code
    const status = res.statusCode;

    // update the checkout and pass the next process
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      worker.processCheckOutcome(copyCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  //   error event handling
  req.on("error", (error) => {
    checkOutcome = {
      error: true,
      value: error,
    };
    // update the checkout and pass the next process
    if (!outcomeSent) {
      worker.processCheckOutcome(copyCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // timeout handling
  req.on("timeout", () => {
    checkOutcome = {
      error: true,
      value: "timeout",
    };
    // update the checkout and pass the next process
    if (!outcomeSent) {
      worker.processCheckOutcome(copyCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  //   request send
  req.end();
};

// validate check data
worker.validateCheckData = (checkData) => {
  let copyCheckData = checkData;
  if (copyCheckData && copyCheckData.checkId) {
    copyCheckData.state =
      typeof copyCheckData.state === "string" &&
      ["up", "down"].indexOf(copyCheckData.state) > -1
        ? copyCheckData.state
        : "down";

    copyCheckData.lastChecked =
      typeof copyCheckData.lastChecked === "number" &&
      copyCheckData.lastChecked > 0
        ? copyCheckData.lastChecked
        : false;

    // pass to the next process
    worker.performCheck(copyCheckData);
  } else {
    console.log("Error: Check was invalid");
  }
};

// lookup all the checks
worker.gatherAllChecks = () => {
  // get all the checks
  data.list("checks", (error1, checks) => {
    if (!error1 && checks) {
      checks.forEach((check) => {
        data.read("checks", check, (error2, checkData) => {
          if (!error2 && checkData) {
            const originalCheckData = { ...parseJSON(checkData) };
            worker.validateCheckData(originalCheckData);
          } else {
            console.log("Error: Reading one of check data");
          }
        });
      });
    } else {
      console.log("Error: Could not find any checks to process");
    }
  });
};

// loop through all checks
worker.loop = () => {
  setInterval(worker.gatherAllChecks, 5000);
};

// start worker
worker.init = () => {
  //   execute all the checks
  worker.gatherAllChecks();

  //   loop through gatherAllChecks() for a periodic time
  worker.loop();
};

// export worker
module.exports = worker;
