const db = require('./db');
const endReq = require("./endReq")("__cache__/api/travels");
const toObject = (doc) => doc.toObject();

//GET /api/travels
async function getTravels(req, res) {
    try {
        const travels = (await db.Travels.find({})).map(toObject);
        res.json(travels);
    }
    catch (err) {
        res.json(err);
    }
}

//POST /api/travels
function saveTravel(req, res) {
    let travel = req.body;
    if (!travel._id) {
        let newTravel = new db.Travels(travel);
        newTravel.save(endReq.bind(res));
    } else {
        db.Travels.findOneAndUpdate({_id: travel._id}, travel, {upsert: true}).exec(endReq.bind(res));
    }    
}

//DELETE /api/travels/:_id
function removeTravel(req, res) {
    db.Travels.remove({_id: req.params._id}).exec(endReq.bind(res)); 
}

module.exports = {
    getTravels,
    saveTravel,
    removeTravel
};