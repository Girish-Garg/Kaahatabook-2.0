const mongoose = require("mongoose");
const debug = require("debug")('dev:mongooseConfig');

mongoose.connect("mongodb://localhost:27017/kaahatabook");

const db = mongoose.connection;

db.on("error",(err)=>{
    debug(err);
})

db.on("open",()=>{
    debug("connected to db");
})

module.exports = db;