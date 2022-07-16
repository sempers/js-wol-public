Array.prototype.sortBy = function(callback) {
    return _.sortBy(this, callback);
}

Array.prototype.reject = function(callback) {
    return _.reject(this, callback);
}