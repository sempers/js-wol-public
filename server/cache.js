const memCache = require('memory-cache');

function setDuration(duration) {
    return (req, res, next) => {
        let key = '__cache__' + req.originalUrl || req.url;
        let cachedBody = memCache.get(key);
        if (cachedBody) {
            return res.json(cachedBody);
        } else {
            res.json_old = res.json;
            res.json = (body) => {
                memCache.put(key, body, duration * 1000);
                res.json_old(body);
            };
            next();
        }
    }
}

function getVal(key) {
    return memCache.get(key);
}

function clearVal(key) {
    memCache.del(key)
}

function putVal(key, value, duration) {
    memCache.put(key, value, duration);
}

module.exports = {
    setDuration,
    getVal,
    putVal,
    clearVal
}