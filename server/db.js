const DB_URI = process.env.DB_URI;
const mongoose = require('mongoose');
const config = require('./config');
const connected = false;

mongoose.connection.on('connected', () => console.log('Mongoose connected to ' + DB_URI));
mongoose.connection.on('error', err => console.log('Mongoose connection error: ' + console.dir(err)));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

let Life = mongoose.model("Life", 
new mongoose.Schema({
    name: String,
    birthdate: Date,
    deathdate: Date,
    estimated: Boolean,
    spans: [{
        id: String,
        kind: String,
        name: String,
        start: Date,
        end: Date,
        color: String
    }]
}), "lifes");

let Weeks = mongoose.model("Weeks", new mongoose.Schema({
    name: String,
    weekNum: Number,
    info: String,
    msgCount: Number,
    photoCount: Number,
    startTime: Date,
    endTime: Date,
    year: Number,
    yearNum: Number
}), "weeks");

let Messages = mongoose.model("Messages", new mongoose.Schema({
    chat: String,
    week: Number,
    isin: Boolean,
    date: Date,
    sndr: String,
    rcvr: String,
    text: String,
    chan: String,
    conf: Boolean,
    hash: String,
    tgId: Number,
    time: Number
}), "messages");

let MessagesRules = mongoose.model("MessagesRules", new mongoose.Schema({
    match: String,
    target: String
}), "message_rules");

//MONEY

let Accounts = mongoose.model("Accounts", new mongoose.Schema({
    f41_id: String,
    name: String,
    created: Date,
    sort: Number,
    currency: String,
    hidden: Boolean,
    details: String,
    startBalance: Number,
    balance: Number,
    type: String,
    special: Boolean
}), "accounts");

let PinnedTags = mongoose.model("PinnedTags", new mongoose.Schema({
    f41_id: String,
    name: String,
    hidden: Boolean,
    created: Date,
    budget: Number,
    budget_type: String,
    expanded: Boolean,
    chart: Boolean,
    color: String
}), "pinned_tags");

let Transactions = mongoose.model("Transactions", new mongoose.Schema({
    f41_id: Number,
    type: String,
    src: String,
    dst: String,
    amount: Number,
    date: Date,
    year: Number,
    month: Number,
    desc: String,
    created: Date,
    edited: Date,
    rate: Number,
    dst_amount: Number,
    tag: String,
    removed: Boolean,
    active: Boolean
}), "transactions");

let HistoricalRates = mongoose.model("HistoricalRates", new mongoose.Schema({
    YM: Number,
    RUB: Number,
    USD: Number,
    EUR: Number,
    BTC: Number,
    ETH: Number,
    BNB: Number,
    date: Date
}), "historical_rates");

let Companions = mongoose.model("Companions", new mongoose.Schema({
    name: String,
    vk_id: String,
    tg_ids: [Number],
    other_ids: [String],
    full_name: String,
    note: String,
    group: String,
    sex: String,
    years: String,
    num: Number,
    first_message: Date,
    last_message: Date,
    dateOfBirth: Date,
    yearOfBirth: Number,    
}), "companions");

let Travels = mongoose.model("Travels", new mongoose.Schema({
    lng: Number,
    lat: Number,
    date: String,
    note: String
}), "travels");

let Photos = mongoose.model("Photos", new mongoose.Schema({
    resource_id: String,
    name: String,
    path: String,
    big_preview: String,
    last_accessed_date: Date,
    thumb: String,
    size: Number,
    location: String,
    date: Date,
    manual_date: Date,
    no_exif: Boolean,
    year: Number,
    weekNum: Number,
    removed: Boolean
}), "photos");

let PhotoBigPreviews = mongoose.model("PhotoBigPreviews", new mongoose.Schema({
    resource_id: String,
    big_preview: String
}), "photo_big_previews");

function connect() {
    if (config.USE_LOCAL_SERVER) {
        let options = { 
            user: process.env.DBUSER,
            pass: process.env.DBPASSWORD,
            keepAlive: true,
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        };
        try {
            return mongoose.connect(DB_URI, options);
        } catch (e) {
            mongoose.connection && mongoose.connection.close();
            return mongoose.createConnection(DB_URI, credentials);
        }
    } else {
        console.log("DB will not connect, using remote API");
    }    
}

function reset() {
    try { mongoose.connection && mongoose.connection.close(); } catch (e) { }
}

module.exports = {
    Life,
    Weeks,
    Messages,
    MessagesRules,
    Accounts,
    PinnedTags,
    Transactions,
    HistoricalRates,
    Companions,
    Photos,
    PhotoBigPreviews,
    Travels,
    connect,
    reset,
    connected
};



