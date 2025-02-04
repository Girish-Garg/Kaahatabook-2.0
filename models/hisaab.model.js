const mongoose = require('mongoose');
const moment = require('moment');

const hisaabSchema = mongoose.Schema({

    title : String,
    content : String,
    date : {
        type: String,
        default: () => moment().format('DD-MM-YYYY'),
    },
    isEncrypted: {
        type: Boolean,
        required: true,
        default: false,
    },
    encryptPass: {
        type: String,
        required: function() {
            return this.isEncrypted;
        }
    },
    isShareable: {
        type: Boolean,
        required: true,
    },
    isEditable: {
        type: Boolean,
        required: function() {
            return this.isShareable;
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
})

module.exports = mongoose.model('hisaab',hisaabSchema)

