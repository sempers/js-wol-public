const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const input = require("input");
const { dateToWeekNum } =  require("./yearWeeks");
var crypto = require('crypto');
var moment = require('moment');

const apiId = 173000;
const apiHash = process.env.TG_API_HASH;
const phone = process.env.PHONE;
const myId = Number(process.env.TG_MY_ID);
const password = process.env.TG_PASSWORD;
const session = new StringSession(process.env.TG_SESSION);
const birthday = process.env.TG_BIRTHDAY;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectNoSession() {
	console.log("Connection with no session...");
	const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 1 });
	await client.start({
		phoneNumber: async () => phone,
		password: async () => password,
		phoneCode: async () => await input.text("Input phone code: "),
		onError: (err) => {
			console.log(err);
			process.exit(1);
		},
	});
	console.log("You should now be connected.");
	console.log(client.session.save());
}

async function connect() {
	const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 1 });
	await client.start();
	console.log("You should now be connected.");
    return client;
}

function loadIdUsernameMapping() {
	const lines = fs.readFileSync(__dirname + "\\data\\tgusernames.txt", "utf-8").split(/\r?\n/);
    let mapping = {};
	for (const line of lines) {
        const [key, value] = line.split('=');
        mapping[Number(key)] = value;
	}
    return mapping;
}

async function extractChatHistory(client, peer) {
    let addOffset = 0;
    let currentCount = 0;

    let historyList = [];
    while (true) {
        try {
            history = await client.invoke(
                new Api.messages.GetHistory({
                peer,
                addOffset,
                limit: 100,
            }));

            let count = history.messages.length;
            if (count === 0)
                break;
            historyList.push(history);
            currentCount += count;
            addOffset += count;
            console.log(`Downloaded to the moment: ${currentCount} messages`);
            return historyList;
            await sleep(1000);
        } catch (e) {
            console.error(`Exception downloading chat [${peer.userId}]: ${e.message}`);
            return;
        }
    }
    return historyList;
}

class TgChatInfo {
    constructor(id, title, history) {
        this.id = id;
        this.title = title;
        this.history = history;
    }

    exportHistoryChunk(history, mapping) {
        try {
            console.log(`Exporting [${this.id}] "${this.title}"`);
            let message = {};
            for (const msg of history.messages) {
                if (msg.className != "Message") continue;
                let date = moment.unix(msg.date);
                message.date = date.local()._d;
                message.time = date.local()._d.getTime();
                message.chat = mapping[this.id] || this.title;
                message.week = dateToWeekNum(date);
                message.isin = msg.senderId != myId;
                message.sndr = msg.senderId == myId ? "Myself": this.title;
                message.rcvr = msg.senderId == myId ? this.title: "ME";
                message.text = (msg.fwdFrom && (msg.fwdFrom.channelId || msg.fwdFrom.senderId)) ? `[Forwarded messages] ${msg.message}` : `${msg.message}`;
                message.chan = "tg";
                message.conf = false;
                let hashString = `${date.local()._d.getTime()}|${message.chan}|${message.chat}|${message.isin ? "IN": "OUT"}|${message.text}`;
                message.hash = new Buffer(crypto.createHash('md5').update(hashString).digest("hex")).toString("base64");
                message.tgId = msg.id;                
            }
        } catch (e) {
            console.log(`Exception exporting chat [${chat.id}] "${chat.title}": ${e.message}`);
        }
    }

    exportChat(mapping) {
        this.result = [];
        try {
            console.log(`Exporting [${this.id}] - "${this.title}"`);
            for (const history of this.history) {
                this.result = this.result.concat(this.exportHistoryChunk(history, mapping))
            }
        } catch (e) {
            console.log(`Exception exporting chat [${this.id}] "${this.title}": ${e.message}`);
        }
    }
}

async function doPersonalMessages(client, dialogs) {
    let chats = [];
    const mapping = loadIdUsernameMapping();

    for (const tguser of dialogs.users) {
        if (tguser.firstName == "Telegram" || tguser.bot)
            continue;
        const peer = new Api.InputPeerUser({
            userId: tguser.id,
            accessHash: tguser.accessHash || 0
        });
        const id = tguser.id;
        const title = `${tguser.firstName || ""} ${tguser.lastName || ""}`.trim() || id.toString();
        console.log(`Started downloading user [${id}] "${title}"`);
        try {
            const history = await extractChatHistory(client, peer);
            if (history.length > 0) {
                chats.push(new TgChatInfo(id, title, history));
            }    
        } catch (e) {
            console.error(`Exception downloading chat [${id}]: ${e.message}`);
        }
        break;
    }
    // Mongodb
    const db = require("../db");
    let wholeDb = [];
    for (const chat of chats) {
        wholeDb = wholeDb.concat(chat.exportChat(mapping));
    }
}

(async () => {
	const client = await connect();
	
    const dialogs = await client.invoke(new Api.messages.GetDialogs({
            offsetDate: 0,
            offsetId: 0,
            offsetPeer: new Api.InputPeerEmpty(),
            limit: 100,
            hash: 0,
            excludePinned: false,
            folderId: null
    }));

    await doPersonalMessages(client, dialogs);
})();
