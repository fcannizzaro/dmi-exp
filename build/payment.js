var Schema, extra, model, mongoose;

mongoose = require('mongoose');

Schema = mongoose.Schema;

model = {
  id: String,
  emails: Array,
  quote: String,
  success: Boolean,
  created: String
};

extra = {
  collection: 'payments',
  versionKey: false
};

module.exports = mongoose.model('Payment', new Schema(model, extra));
