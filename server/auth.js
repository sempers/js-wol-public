const auth = require("basic-auth");
const db = require('./db');
const axios = require('axios')
const urllib = require('url');

function unauthorized(req, res, err) {
    req.session = null;
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.status(401).send(err ? err.toString() : "Unknown authorization/db connection error");
}

function basicAuth(req, res, next) {
    if (!db.connected || !req.session.userName) {
        let user = auth(req);

        function authSuccess() {
            req.session.userName = user.name;
            db.connected = true;
            req.next();
        }

        function authError(err) {
            db.reset();
            unauthorized(req, res, err);
        }

        if (!user || !user.name || !user.pass) {
            return unauthorized(req, res, "No authentication provided");
        }

        if (db.connected)
            db.Users.findOne({ name: user.name, pass: user.pass })
                .exec(function (err, doc) {
                    if (!err && doc != null) {
                        authSuccess();
                    } else {
                        authError(err || "Invalid username/password");
                    }
                });
        else {
            db.connect({ user: user.name, pass: user.pass }).then(authSuccess, authError);
        }
    }
    else
        return next();
}

async function getYandexToken(req, res) {
    try {
        // https://oauth.yandex.ru/client/
        // https://oauth.yandex.ru/authorize?response_type=token&client_id=
        let url = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${process.env.YA_APP_ID}`;
        const response = await axios.get(url);
        res.status(200).send(response.data);
    } catch (e) { res.json(e); }
}

async function getToken(req, res) {
    let code = req.query.code;
    let data = urllib.URLSearchParams({
        "grant_type": "authorization_code",
        "code": code,
        "client_id": process.env.YA_APP_ID,
        "client_secret": process.env.YA_APP_PWD
    }).toString();

    try {
        const response = await axios.post("https://oauth.yandex.ru/token",  data);
        res.json(response.data);
    }
    catch (e) {
        res.json(e);
    }
}


module.exports = {
    unauthorized,
    basicAuth,
    getYandexToken,
    getToken
}