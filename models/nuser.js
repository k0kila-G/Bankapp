const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/bankDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const newschema = mongoose.Schema({
  nusername: {
    type: String,
    unique: true,
    required: true,
  },
  nemail: {
    type: String,
    unique: true,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const newuserModel = mongoose.model("user1", newschema);

module.exports = newuserModel;
