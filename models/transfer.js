const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/bankDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const historySchema = new mongoose.Schema({
  sName:{
      type:String,
      require: true
  },
  sEmail:{
      type:String,
      require: true
  },
  rName:{
      type:String,
      require: true
  },
  rEmail:{
      type:String,
      require: true
  },
  amount:{
      type:Number,
      require: true
  },
  date:{
      type: Date,
      default: Date.now
  }
});

const nuserModerl = new mongoose.model('user2', historySchema);

module.exports = nuserModerl;