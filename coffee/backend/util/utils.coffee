config = require "./config_utils"
week = 1000 * 60 * 60 * 24 * 7

exports.calcWeek =  (date) ->
    temp = date - new Date config.backend.project_start
    temp /= week
    Math.floor temp + 1
