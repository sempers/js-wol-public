const config = require('./config');

module.exports = function renderApp(module) {
    if (!process.env.API_VERSION || process.env.API_VERSION == "V1")
    {
        console.log("API VERSION 1");
        switch (module) {
            case "wol": return function (req, res) { 
                res.render("app/wol/wol-vue.html", config.serverParams());
            }; 

            case "msg": return function (req, res) {
                res.render("app/msg/msg-vue.html", config.serverParams());
            }; 

            case "money": return function (req, res) {
                res.render("app/money/money-vue.html", config.serverParams());
            }; 

            case "login": return function (req, res) {
                res.render("app/login/login-vue.html", config.serverParams());
            }; 
            
            default: return function (req, res) {
                res.status(404);
            }
        }
    } else {
        console.log("API VERSION 2");
        return function(req, res) {
            if (req.path != "/")
                res.redirect("/#/" + req.path.replace("/",""));
            else
                res.render("index2.html", config.serverParams());
        }
    }
}