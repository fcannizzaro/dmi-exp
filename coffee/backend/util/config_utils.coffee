fs = require "fs"
p = "./build/configuration/"

read = (p) -> JSON.parse fs.readFileSync(p).toString()

config = read "#{p}config.json"

config.matches = read "#{p}matches.json"

config.season2014 = read "#{p}season2014.json"

module.exports = config