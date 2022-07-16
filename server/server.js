const cons = require('consolidate')
    , http = require('http')
    , path = require('path')
    , express = require('express')
    , bodyParser = require('body-parser')
    , morgan = require('morgan')
    , favicon = require('serve-favicon')
    , cookieSession = require("cookie-session")
    , db = require('./db')
    , api_wol = require('./api-wol')
    , api_money = require('./api-money')
    , api_msg = require('./api-msg')
    , api_travel = require('./api-travel')
    , renderPage = require('./render')
    , config = require("./config")
    , auth = require("./auth");

const app = express();

app.engine("html", cons.ejs);
app.set('view engine', 'html');
app.set("views", path.resolve(__dirname, '../client/public'));
app.set('trust proxy', 1);

app.use(express.static(path.resolve(__dirname, '../client/public'), {
    etag: false
}));

app.use(bodyParser.json());
app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use(morgan('common'));
app.use(cookieSession({
    name: 'session',
    keys: ["29b6BCZ*1q"],
    maxAge: 30 * 24 * 60 * 60 * 1000
}));

//html
app.get("/wol", renderPage("wol"));
app.get("/login", renderPage("login"));
app.get("/money", renderPage("money"));
app.get("/msg", renderPage("msg"));
app.get("/old_wol", function (req, res) { res.render("app/wol/wol-vue.html", config.serverParams()); });
app.get("/old_money", function (req, res) { res.render("app/money/money-vue.html", config.serverParams()); });

//API
//token
app.get("/api/getYandexToken", auth.getYandexToken);
app.get("/api/getToken", auth.getToken);

//wol
app.get("/api/wol/weeks", api_wol.getWeeks);
app.post("/api/wol/weeks",  api_wol.saveWeek);
app.put("/api/wol/weeks/:weekNum", api_wol.patchWeek);
app.get("/api/wol/photos/:weekNum", api_wol.getPhotos);
app.put("/api/wol/photos", api_wol.savePhoto);
app.get("/api/wol/photo/preview/:path", api_wol.getPhotoPreview);
app.delete("/api/wol/photo/:_id", api_wol.removePhoto);

//travels
app.get("/api/travels", api_travel.getTravels);
app.post("/api/travels",  api_travel.saveTravel);
app.delete("/api/travels/:_id", api_travel.removeTravel);

//money
app.get("/api/money/rates", api_money.mwRates, api_money.getRates);
app.get("/api/money/histRates", api_money.getHistRates);
app.get("/api/money/currentRates", api_money.getCurrentRates);
app.get("/api/money/saveCurrentRates", api_money.saveCurrentRates); //test
app.post("/api/money/tx", api_money.addTx);
app.put("/api/money/tx", api_money.saveTx);
app.delete("/api/money/tx/:_id", api_money.removeTx);
app.post("/api/money/tags", api_money.addPt);
app.put("/api/money/tags", api_money.savePt);
app.post("/api/money/tags/rename", api_money.renamePt);
app.delete("/api/money/tags/:_id", api_money.removePt);
app.post("/api/money/accounts", api_money.addAcc);
app.post("/api/money/accounts/rename", api_money.renameAcc);
app.put("/api/money/accounts", api_money.saveAcc);
app.post("/api/money/rates", api_money.saveRates);
app.get("/api/money", api_money.mwRates, api_money.getMoney);    //allInfo

//messages
app.get("/api/msg/chat/:chat", api_msg.getChat);
app.get("/api/msg/chats", api_msg.getMessagesByChats);
app.post("/api/msg/chats", api_msg.saveCompanion);
app.post("/api/msg/chats/rename", api_msg.mergeCompanion);
app.post("/api/msg/chats/correct", api_msg.correctChats);
app.get("/api/msg/rules", api_msg.getRules);
app.post("/api/msg/rules", api_msg.addRule);
app.delete("/api/msg/rules", api_msg.removeRule);
app.delete("/api/msg/:_id", api_msg.deleteMessage);
app.get("/api/msg/week/:weekNum", api_msg.getWeekMessagesV2);
app.get("/api/msg/:weekNum", api_msg.getWeekMessages);

//default
app.get("/", renderPage("wol"));

db.connect();

const httpPort = process.env.PORT || 3000;
const server = http.createServer(app).listen(httpPort, () => console.log(`WoL server [for name: ${process.env.NAME}] is working on port ${httpPort}`));
server.setTimeout(30 * 60 * 1000);