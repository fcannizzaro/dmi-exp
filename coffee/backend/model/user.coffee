mongoose = require 'mongoose'
Schema = mongoose.Schema

model =
    name: String
    email : String
    type: String
    from: Number
    paid:
    	type: Boolean
    	default: false
    bets : Schema.Types.Mixed
    season : Schema.Types.Mixed

extra =
	collection: 'users'
	versionKey: false
	
module.exports = mongoose.model 'User', new Schema model, extra