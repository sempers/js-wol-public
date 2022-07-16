const https = require("https");
const httpsAgent = new https.Agent({ rejectUnauthorized: false});
const axios = require("axios");
const db = require("./db");
const cache = require("./cache");
const config = require("./config");
const _ = require("underscore");
const endReq = require("./endReq")("__cache__/api/money");
const toObject = doc => doc.toObject();
const tinkoffLag = 15 * 60 * 1000;


function renderMoney(req, res) {
    res.render("app/money/money-vue.html", config.serverParams());
}

// obsolete
function testMoney(req, res) {
    let accounts, pinned_tags, transactions = require("./test_data/money_data.js");
    let rates = req.rates;
    res.render("app/money/money-vue.html", {
        accounts,
        pinned_tags,
        transactions,
        rates
    });
}

// GET /api/money
async function getMoney(req, res) { 
    const rates = req.rates;  
    try {
        let accounts = (await db.Accounts.find({})).map(toObject);
        let baseTags = (await db.PinnedTags.find({})).map(toObject);
        let transactions = (await db.Transactions.find({})).map(toObject);
        res.json({
            accounts,
            baseTags,
            transactions,
            rates
        });
    } catch (err) {
        res.json(err);
    }    
}

//GET /api/money/histRates
async function getHistRates(req, res) {
    try {
        let rates = (await db.HistoricalRates.find({})).map(toObject);
        res.json(rates);
    }
    catch (err) {
        res.status(500).send(util.inspect(err));
    }
}

//middleware
function fetchCurrentRates() {
    return new Promise(async (resolve, reject) => {
        const supportedCrypto = ["BTC", "ETH", "BNB"];
        let rates = {"YM": 0, "RUB": 1.0, "USD": 0, "EUR": 0, iter: 0, date: new Date()};
        const tmOptions = { timeout: 15000, httpsAgent: httpsAgent };
        try {
            let i = 0;
            while (!rates.USD || !rates.EUR) {
                const tinkoffResponse = await axios.get("https://tinkoff.ru/api/v1/currency_rates", tmOptions);
                for (let rate of tinkoffResponse.data.payload.rates) {
                    if (!rate.category || !rate.fromCurrency || !rate.toCurrency)
                        continue;
                    if (rate.category === "DebitCardsTransfers" && rate.fromCurrency.name === "USD" && rate.toCurrency.name === "RUB") {
                        rates.USD = (rate.buy + rate.sell) / 2;
                    } else if (rate.category === "DebitCardsTransfers" && rate.fromCurrency.name === "EUR" && rate.toCurrency.name === "RUB") {
                        rates.EUR = (rate.buy + rate.sell) / 2;
                    }
                }
                rates.iter = ++i;
            }
            try {
                const cmcResponse = await axios.get("https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=15&convert=USD&CMC_PRO_API_KEY=347ce836-e2cf-4a66-bbc4-e1a44d195042", tmOptions);
                for (let ticker of cmcResponse.data.data) {
                    if (supportedCrypto.includes(ticker.symbol)) {
                        rates[ticker.symbol] = +ticker.quote.USD.price * rates.USD;
                    }
                }
                resolve(rates);
            } catch (err) {
                reject({error: err, stage: 'calling_coinmarketcap'});
            };
        } catch (err) {
            reject({error: err, stage: 'calling_tinkoff'});
        };
    });
}

// Мидлвэр для курсов
async function mwRates(req, res, next) {
    //Get out from cache if there
    const cachedRates = cache.getVal("rates");
    if (cachedRates) {
        req.rates = cachedRates;
        next();
    } else {
        //load historical rates
        let histRates = [{"YM": 0, "RUB": 1.0, date: new Date()}];
        try {
            histRates = (await db.HistoricalRates.find({})).map(toObject);
            let oldValue = _.find(histRates, x => x.YM === 0);
            if (oldValue && (new Date()).getTime() - oldValue.date.getTime() < tinkoffLag) {
                req.rates = histRates;
                next();
                return;
            }
            //replace or add fresh rates       
            const currentRates = await fetchCurrentRates();            
            oldValue = _.find(histRates, x => x.YM === 0);
            if (oldValue) {
                oldValue = currentRates;
            } else {
                histRates.push(currentRates);
            }
            //save fresh rates if only USD and EUR
            if (currentRates.USD && currentRates.EUR) {
                await db.HistoricalRates.findOneAndUpdate({"YM": 0}, currentRates, {"upsert": true });
                cache.putVal("rates", histRates, tinkoffLag); //cache for 30 minutes
            }
            req.rates = histRates; //adding to request
            next();
        } catch (err) {
            req.rates = histRates;
            next();
        }
    }
}

//GET /api/money/currentRates
async function getCurrentRates(req, res) {
    try {
        res.json(await fetchCurrentRates());
    } catch (err) {
        res.json(Object.assign({ RUB: 1.0, error: true, date: new Date() }, err))
    }
}

//GET /api/money/saveCurrentRates
async function saveCurrentRates(req, res) {
    try {
        let currentRates = await fetchCurrentRates();
        await db.HistoricalRates.findOneAndUpdate({"YM": 0}, currentRates, {"upsert": true });
        currentRates.saved = true;
        cache.clearVal("rates");
        res.json(currentRates);
    } catch (err) {
        res.json(err);
    }
}

//GET api/rates
function getRates(req, res) {
    res.json(req.rates);
}

//GET /money
function renderMoney(req, res) {
    res.render("app/money/money-vue.html", config.serverParams());
}

//------------------Transactions
//DELETE /api/money/tx/:_id
function removeTx(req, res) {
    db.Transactions.remove({ _id: req.params._id }).exec(endReq.bind(res));
}

//POST /api/money/tx
function addTx(req, res) {
    const tx = req.body;
    const nTx = new db.Transactions(tx);
    nTx.save(endReq.bind(res));
}

//PUT /api/money/tx
function saveTx(req, res) {
    const tx = req.body;
    db.Transactions.findOneAndUpdate({_id: tx._id}, tx, {"upsert": true }).exec(endReq.bind(res));
}

//Accounts
//POST /api/money/accounts
function addAcc(req, res) {
    const acc = req.body;
    const nAcc = new db.Accounts(acc);
    nAcc.save(endReq.bind(res));
}

//PUT /api/money/accounts
function saveAcc(req, res) {
    const acc = req.body;
    delete acc.__v;
    db.Accounts.findOneAndUpdate({ _id: acc._id }, acc).exec(endReq.bind(res));
}

//Tags
//POST /api/money/tags
function addPt(req, res) {
    const pt = req.body;
    const npt = new db.PinnedTags(pt);
    npt.save(endReq.bind(res));
}

//PUT /api/money/tags
function savePt(req, res) {
    const pt = req.body;
    delete pt.__v;
    db.PinnedTags.findOneAndUpdate({ _id: pt._id }, pt, {"upsert": true}).exec(endReq.bind(res));
}

//POST /api/money/tags/rename
function renamePt(req, res) {
    let oldName, newName;
    ({oldName, newName} = req.body);
    db.Transactions.updateMany({ tag: oldName }, { $set: { tag: newName }}).exec(endReq.bind(res));
}

//POST /api/money/acconts/rename
function renameAcc(req, res) {
    let oldName, newName;
    ({oldName, newName} = req.body);
    db.Transactions.updateMany({src: oldName}, {$set: {src: newName}}).exec(() => {
        db.Transactions.updateMany({ dst: oldName }, { $set: { dst: newName }}).exec(endReq.bind(res));
    });
}

//DELETE /api/money/tags/:_id
function removePt(req, res) {
    db.PinnedTags.remove({_id: req.params._id }).exec(endReq.bind(res));
}

//POST /api/money/rates
function saveRates(req, res) {
    let rates = req.body;
    delete rates._id;
    let now = new Date();
    let ym = (now.getFullYear() % 2000) * 100 + now.getMonth();
    rates.YM = ym;
    db.HistoricalRates.findOneAndUpdate({ YM: ym }, rates, {"upsert": true}).exec(endReq.bind(res));
}

module.exports = {
    renderMoney,
    cache,
    getHistRates,
    getCurrentRates,
    saveCurrentRates,
    getRates,
    mwRates,
    testMoney,
    getMoney,
    renderMoney,
    removeTx,
    addTx,
    saveTx,
    addAcc,
    saveAcc,
    addPt,
    savePt,
    renamePt,
    renameAcc,
    removePt,
    saveRates
};