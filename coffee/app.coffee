app = require "./build/init"
server = app __dirname

server.listen process.env.PORT || 80