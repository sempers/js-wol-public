const API_TOKEN = process.env.API_TOKEN;
const db = require("../db");
const api = require("ya-disk-rest-api");
const disk = new api.YaDisk(API_TOKEN);
const axios = require("axios");
const moment = require("moment");
const { dateToWeekNum } = require("./yearWeeks");
const qs = require("querystring");

function re1(name) {
	try {
		let [group, day, month, year, _] = name.match(/^(\d{2})(\d{2})(\d{4})/);
		if (+year < 2000 || +year > new Date().getFullYear()) return null; //fail
		return new Date(+year, +month - 1, +day);
	} catch (e) {
		return null;
	}
}

function re2(name) {
	try {
		let [group, year, month, day, _] = name.match(/^(\d{4})(\d{2})(\d{2})_/);
		if (+year < 2000 || +year > new Date().getFullYear()) return null; //fail
		return new Date(+year, +month - 1, +day);
	} catch (e) {
		return null;
	}
}

function re3(name) {
	try {
		let [group, year, month, day, _] = name.match(/^IMG_(\d{4})(\d{2})(\d{2})_/);
		if (+year < 2000 || +year > new Date().getFullYear()) return null; //fail
		return new Date(+year, +month - 1, +day);
	} catch (e) {
		return null;
	}
}

function re4(name) {
	try {
		let [group, year, month, day, _] = name.match(/^IMG-(\d{4})(\d{2})(\d{2})-/);
		if (+year < 2000 || +year > new Date().getFullYear()) return null; //fail
		return new Date(+year, +month - 1, +day);
	} catch (e) {
		return null;
	}
}

async function getJPEGBase64(path) {
	try {
		let url = "https://webdav.yandex.ru/" + qs.escape(path.replace("disk:/", "")) + "?preview&size=S";
		const response = await axios.get(url, { headers: { Authorization: "OAuth " + API_TOKEN }, responseType: "arraybuffer" });
		let b64 = Buffer.from(response.data, "binary").toString("base64");
		return "data:image/jpeg;base64," + b64;
	} catch (e) {
		console.dir(e);
		return null;
	}
}

let counter = 0;

async function processPhoto(photo, noDataMode) {
	var date, weekNum, year;
	let noExif = false;
	// EXIF
	if (photo.exif && photo.exif.date_time) {
		date = moment(photo.exif.date_time);
		//fix aмстердам, париж
		if (photo.name.startsWith("SAM_")) {
			date = date.add(166, "days");
		}
		weekNum = dateToWeekNum(date);
		year = date._d.getFullYear();
	}
	// PARSING
	else {
		var date = re1(photo.name) || re2(photo.name) || re3(photo.name) || re4(photo.name);
		if (date) {
			date = moment(date);
			weekNum = dateToWeekNum(date);
			year = date._d.getFullYear();
		} else {
			noExif = true;
			year = noDataMode.year;
			date = new Date(year, 5, 14);
			weekNum = dateToWeekNum(date);
		}
	}
	if (date && weekNum && year) {
		var thumb = await getJPEGBase64(photo.path);

		var dbPhoto = {
			resource_id: photo.resource_id,
			name: photo.name,
			path: photo.path,
			thumb: thumb,
			size: photo.size,
			date: date,
			year: year,
			weekNum: weekNum,
			no_exif: noExif,
		};

		try {
			await db.Photos.findOneAndUpdate({ resource_id: photo.resource_id }, dbPhoto, { upsert: true });
			console.log(`Written photo #${++counter} ${noExif ? "[NO_EXIF] " : ""}${date} (${weekNum}) : ${photo.path}`);
		} catch (e) {
			console.dir(e);
		}
	}
}

async function flattenFolder(path) {
	console.log("Processing folder: " + path);
	let items = [];
	try {
		let folder = await disk.getItemMetadata({ path: path, limit: 10000 });
		if (folder && folder._embedded) {
			for (let item of folder._embedded.items) {
				if (item.type == "file" && ["image/jpeg", "image/heic"].includes(item.mime_type)) {
					items.push(item);
				} else if (item.type == "dir") {
					items = items.concat(await flattenFolder(item.path));
				}
			}
		}
	} catch (err) {
		console.dir(err);
	} finally {
		return items;
	}
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function sliceIntoChunks(arr, chunkSize) {
	const res = [];
	for (let i = 0; i < arr.length; i += chunkSize) {
		const chunk = arr.slice(i, i + chunkSize);
		res.push(chunk);
	}
	return res;
}

async function processFolder(path, year) {
	let yearData = year ? { year } : null;
	let items = await flattenFolder(path);
	console.log(`Total ${items.length} photos in ${path}`);
	for (let photo of items) 
        await processPhoto(photo, yearData);
}

(async () => {
	await db.connect();
	try {
		for (let year = 2006; year <= 2022; year++) {
			await processFolder(`disk:/photo/${year}`, year);
		}
		await processFolder("disk:/photo-Lera");
		console.log("OK!");
	} catch (err) {
		console.dir(err);
	}
})();
