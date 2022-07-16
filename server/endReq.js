const cache = require("./cache");
const util = require("util");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//bound to "res"
module.exports = function(clearCacheVal) {
    return function(err, doc) {
        if (err) {
            this.status(500).send(util.inspect(err)); //this = res
        } else {
            if (clearCacheVal) {
                cache.clearVal(clearCacheVal);
            }
            if (doc) {
                let _id = "";
                if (doc.toObject) {
                    _id = doc.toObject()._id?.toString();
                } else if (doc._id) {
                    _id = doc._id?.toString();
                }
                this.status(200).send({_id});
            } else {
                this.status(200).send("OK");
            }
        }
    }
}