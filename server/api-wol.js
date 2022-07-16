const db = require("./db");
const config = require('./config');
const endReq = require("./endReq")("__cache__/api/weeks");
const toObject = (doc) => doc.toObject();
const util = require("util");
const axios = require("axios");

function renderWol2(req, res) {
    res.render("index2.html", config.serverParams());
}

//GET /[:name]
function renderWol(req, res) {
    res.render("app/wol/wol-vue.html", config.serverParams());
}

// GET /test/wol
function renderTestWol(req, res) {
    res.render("app/wol/wol-vue.html", require("./test_data/wol_data"));
}

//GET /api/wol/weeks
async function getWeeks(req, res) {
    let name = config.NAME;
    try {
        let data = (await db.Life.findOne({name})).toObject();
        data.weekInfo = {};
        let weeks = await db.Weeks.find({name});
        weeks.map(toObject).forEach(week => {data.weekInfo[week.weekNum] = week; });
        res.json(data);
    }
    catch (err) 
    {
        res.status(500).send(`api/wol/weeks error: ${util.inspect(err)}`);
    }
}

async function getPhotos(req, res) {
    const weekNum = +req.params.weekNum || 1;
    try {
        let docs = (await db.Photos.find({weekNum}, {big_preview: 0})).map(toObject);
        res.json(docs);
    } catch (err) {
        res.status(500).send(`api/wol/photos error: ${util.inspect(err)}`);
    }
}

function savePhoto(req, res) {
    const photo = req.body;
    db.Photos.findOneAndUpdate({_id: photo._id}, photo, {upsert: true}).exec(endReq.bind(res));    
}

async function getPhotoPreview(req, res) {
    let path = req.params.path;
    const resource_id = req.query.resource_id || "";
    const size = req.query.size || "XL";
    const alwaysYandex = !!req.query.ya;
    path = Buffer.from(path, 'base64').toString();

    if (!alwaysYandex) {
        try {
            let doc = await db.PhotoBigPreviews.findOne({resource_id});
            if (doc && doc.big_preview) {
                res.send(doc.big_preview);
                return;
            }
        } catch (e) { }
    }
    
    let url = "https://webdav.yandex.ru/" + path + "?preview&size="+size;
    try {
        const response = await axios.get(url, { headers: { Authorization: "OAuth " + process.env.API_TOKEN }, responseType: "arraybuffer" });
        let bigPreview = "data:image/jpeg;base64," + Buffer.from(response.data, "binary").toString("base64");
        if (resource_id) {
            //await db.PhotoBigPreviews.findOneAndUpdate({resource_id}, {$set: {"big_preview": bigPreview}}, {upsert: true});
        }
        res.send(bigPreview);
    } catch (err)
    {
        res.status(500).send(err);
    }
}

async function removePhoto(req, res) {
    let _id = req.params._id;
    db.Photos.findOneAndUpdate({_id}, {$set: {"big_preview": null, "removed": true}}).exec(endReq.bind(res));
}

async function getPhotoPreviewREST(req, res) {
    let path = req.params.path;
    path = Buffer.from(path, 'base64').toString()
    const size = req.query.size || "XXL";
    let url = "https://cloud-api.yandex.net/v1/disk/resources?path="+path+"&preview_size="+size;
    try {
        const response = await axios.get(url, { headers: { Authorization: "OAuth " + process.env.API_TOKEN }});
        res.send(response.data.preview);
    } catch (err)
    {
        res.status(500).send(err);
    }
}

// POST /api/wol/weeks
function saveWeek(req, res) {
    let week = req.body;
    db.Weeks.findOneAndUpdate({ weekNum: week.weekNum }, week, {"upsert": true}).exec(endReq.bind(res))
}

function patchWeek(req, res) {
    let [msgCount, photoCount, year, yearNum] = req.body;
    const weekNum = +req.params.weekNum || 1;
    db.Weeks.findOneAndUpdate({weekNum}, {$set: {msgCount, photoCount, year, yearNum }}).exec(endReq.bind(res));
}

//GET /test
function test(req, res) {
    res.send("test");
}

//GET /login
function renderLogin(req, res) {
    res.render("app/login/login-vue.html", config.serverParams());
}

module.exports = {
    renderWol,
    renderWol2,
    renderTestWol,
    getWeeks,
    saveWeek,
    test,
    renderLogin,
    getPhotos,
    savePhoto,
    removePhoto,
    getPhotoPreview,
    patchWeek
};

//create    add
//read      get
//update    save
//delete    remove