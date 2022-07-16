const _ = require("underscore");
const db = require("./db");
const config = require("./config");
const endReq = require("./endReq")();
const toObject = (doc) => doc.toObject();
const util = require("util");

//html
function renderMsg(req, res) {
	res.render("app/msg/msg-vue.html", config.serverParams());
}

//GET /api/msg/chats
async function getMessagesByChats(req, res) {
	try {
		const data = await db.Messages.aggregate([
			{
				$group: {
					_id: "$chat",
					cnt: { $sum: 1 },
					minDate: { $min: "$date" },
					maxDate: { $max: "$date" },
				},
			},
			{
				$lookup: {
					from: "companions",
					localField: "_id",
					foreignField: "name",
					as: "companion",
				},
			},
			{ $sort: { cnt: -1 } },
		]);
		res.json(data);
	} catch (err) {
		res.status(500).send(util.inspect(err));
	}
}

//POST /api/msg/chats
function saveCompanion(req, res) {
	const item = req.body;
	if (item._id) {
		db.Companions.findOneAndUpdate({ _id: item._id }, item, { upsert: true }).exec(endReq.bind(res));
	} else {
		delete item._id;
		db.Companions.findOneAndUpdate({name: item.name}, item, {upsert: true}).exec(endReq.bind(res));
	}
}

function mergeCompanion(req, res) {
	let oldName, newName;
	({ oldName, newName } = req.body);
	db.Messages.updateMany({ chat: oldName }, { $set: { chat: newName } }).exec(endReq.bind(res));
}

//GET /api/msg/rules
function getRules(req, res) {
	db.MessagesRules.find({}, (err, docs) => {
		if (err) {
			res.json(err);
		} else {
			res.json(docs.map(toObject));
		}
	});
}

//POST /api/msg/addRule
function addRule(req, res) {
	const nRule = new db.MessagesRules(req.body);
	nRule.save(endReq.bind(res));
}

//POST /api/msg/removeRule
function removeRule(req, res) {
	const _id = req.body._id;
	db.MessagesRules.remove({ _id }).exec(endReq.bind(res));
}

//POST /api/msg/correct
function correctChats(req, res) {
	db.MessagesRules.find({}, function(err, docs) {
		if (err) throw err;
		let rules = docs.map(toObject);
		let matches = rules.map((o) => o.match);
		db.Messages.find({ chat: { $in: matches } }, function(err, docs) {
			if (err) {
				throw err;
			}
			let lastMatch = rules.length > 0 ? rules[rules.length - 1].match : null;
			rules.forEach((r) => {
				db.Messages.updateMany({ chat: r.match }, { $set: { chat: r.target } }).exec((err) => {
					if (err) throw err;
					if (r.match === lastMatch) {
						res.json("OK");
					}
				});
			});
		});
	});
}

//GET /api/msg/chat/:chat
function getChat(req, res) {
	let chat = req.params.chat;
	let limit = req.query.limit || 1000;
	let offset = req.query.offset || 0;
	db.Messages.find({ chat })
		.sort({ date: 1 })
		.skip(offset * limit)
		.limit(1000)		
		.exec((err, docs) => {
			if (!err && docs) {
				res.json(docs.map(toObject));
			} else {
				res.json([err]);
			}
		});
}

//GET api/msg/week/:weekNum
async function getWeekMessagesV2(req, res) {
	let weekNum = +(req.params.weekNum || 1);
	if (isNaN(weekNum)) {
		res.json([]);
		return;
	}
	try {
		const data = await db.Messages.aggregate([
			{ $match: { week: weekNum } },
			{
				$group: {
					_id: "$chat",
					cnt: { $sum: 1 },
					messages: { $push: "$$ROOT" },
				},
			},
			{ $sort: { cnt: -1 } },
		]);
		res.json(data);
	} catch (err) {
		res.status(500).send(util.inspect(err));
	}
}

//GET /api/msg/:weekNum
async function getWeekMessages(req, res) {
	let weekNum = +(req.params.weekNum || 1);
	if (isNaN(weekNum)) {
		res.json([]);
		return;
	}
	db.Messages.find({ week: weekNum })
		.sort({ date: 1 })
		.exec((err, docs) => {
			if (!err && docs) {
				let grouped = _.groupBy(docs.map(toObject), (d) => d.chat);
				let sorted = _.sortBy(
					Object.keys(grouped).map((key) => {
						return { chat: key, messages: grouped[key] };
					}),
					(c) => -c.messages.length
				);
				res.json(sorted);
			} else {
				res.json([]);
			}
		});
}

function deleteMessage(req, res) {
	let _id = req.params._id;
	db.Messages.remove({ _id }).exec(endReq.bind(res));
}

module.exports = {
	renderMsg,
	getMessagesByChats,
	getWeekMessages,
	getWeekMessagesV2,
	correctChats,
	getRules,
	addRule,
	removeRule,
	deleteMessage,
	getChat,
	saveCompanion,
	mergeCompanion,
	deleteMessage
};
