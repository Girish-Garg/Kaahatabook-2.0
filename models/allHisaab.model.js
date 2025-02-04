const mongoose = require('mongoose');
const hisaab = require('./hisaab.model');

const allHisaabSchema = mongoose.Schema({
    hisaabs : [hisaab.schema],
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require : true,
    }
})

module.exports = mongoose.model('allHisaab',allHisaabSchema)