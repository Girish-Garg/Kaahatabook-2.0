const mongoose = require("mongoose");
const debug = require("debug")('dev:mongooseConfig');

require('dotenv').config();
mongoose.connect(process.env.MongoDB_URI);

const db = mongoose.connection;

db.on("error",(err)=>{
    debug(err);
})

db.on("open",()=>{
    debug("connected to db");
})

module.exports = db;