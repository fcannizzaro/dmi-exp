var config, week;

config = require("./config_utils");

week = 1000 * 60 * 60 * 24 * 7;

exports.calcWeek = function(date) {
  var temp;
  temp = date - new Date(config.backend.project_start);
  temp /= week;
  return Math.floor(temp + 1);
};
