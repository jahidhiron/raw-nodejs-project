// dependencies
const fs = require("fs");
const path = require("path");

// lib object - module scaffolding
const lib = {};

lib.basedir = path.join(__dirname, "../.data/");

// create a new file, write something to that file and finally close the file
lib.create = (subdir, filename, data, callback) => {
  fs.open(
    lib.basedir + subdir + "/" + filename + ".json",
    "wx",
    (error1, fileDescriptor) => {
      if (!error1 && fileDescriptor) {
        const stringifyData = JSON.stringify(data);
        fs.writeFile(fileDescriptor, stringifyData, (error2) => {
          if (!error2) {
            fs.close(fileDescriptor, (error3) => {
              if (!error3) {
                callback(false);
              } else {
                callback(`Error to close file ${error3}`);
              }
            });
          } else {
            callback(`Error to write file ${error2}`);
          }
        });
      } else {
        callback(`Error to open file ${error1}`);
      }
    }
  );
};

// read file content
lib.read = (subdir, filename, callback) => {
  fs.readFile(
    lib.basedir + subdir + "/" + filename + ".json",
    "utf-8",
    (error, data) => {
      callback(error, data);
    }
  );
};

// update file content
lib.update = (subdir, filename, data, callback) => {
  fs.open(
    lib.basedir + subdir + "/" + filename + ".json",
    "r+",
    (error1, fileDescriptor) => {
      if (!error1 && fileDescriptor) {
        // after opening file first truncate the file
        fs.ftruncate(fileDescriptor, (error2) => {
          if (!error2) {
            const stringifyData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringifyData, (error3) => {
              if (!error3) {
                fs.close(fileDescriptor, (error4) => {
                  if (!error4) {
                    callback(false);
                  } else {
                    callback(`Error to close file ${error4}`);
                  }
                });
              } else {
                callback(`Error to write file ${error3}`);
              }
            });
          } else {
            callback(`Error to truncate file ${error2}`);
          }
        });
      } else {
        callback(`Error to open file ${error1}`);
      }
    }
  );
};

// delete file
lib.delete = (subdir, filename, callback) => {
  fs.unlink(lib.basedir + subdir + "/" + filename + ".json", (error) => {
    if (!error) {
      callback(false);
    } else {
      callback(`Error to delete file ${error}`);
    }
  });
};

// list all the file in a library
lib.list = (subdir, callback) => {
  fs.readdir(lib.basedir + subdir + "/", (error, filenames) => {
    if (!error && filenames && filenames.length > 0) {
      const trimmedFilenames = [];
      filenames.forEach((filename) => {
        trimmedFilenames.push(filename.replace(".json", ""));
      });
      callback(false, trimmedFilenames);
    } else {
      callback(`Error to read dir ${error}`);
    }
  });
};

module.exports = lib;
