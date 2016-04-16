var Schema, extra, model, mongoose;

mongoose = require('mongoose');

Schema = mongoose.Schema;

model = {
  week: String,
  results: Schema.Types.Mixed,
  season: Schema.Types.Mixed
};

extra = {
  collection: 'results',
  versionKey: false
};

module.exports = mongoose.model('Result', new Schema(model, extra));
