const mongoose = require("mongoose");
mongoose.plugin(require('mongoose-autopopulate'))
const mongodb_uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/E-Commerce-dev";

mongoose.set({ 'strictQuery': false })
mongoose.connect(mongodb_uri)