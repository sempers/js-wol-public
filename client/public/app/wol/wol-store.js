const $store = {
	loading: false,

	name: $server.NAME,

	//объекты компонентов после маунтинга
	weeks: [],

	years: {},

	firstYearPlaceHolderWidth: 0,

	test: {
		wiTimes: []
	},

	tags: {
		stats: [],
		searched: '',
		current: undefined,
		updateCache: true,
		cache: []
	},

	curWeek: {
		info: "",
		index: -1,
		weekNum: -1,
		colored_flags: [],
		messages: []
	},

	curMessages: [],

	//header
	lived: {
		percentage: 0.0,
		weeks: 0,
		days: 0,
		hours: 0
	},

	remained: {
		percentage: 0.0,
		weeks: 0,
		days: 0,
		hours: 0
	},

	searchedWord: "",

	shownEditDialog: false,
	shownMapDialog: false,
	shownMessageDialog: false,
	shownPillsDialog: false,

	curMsgTab: 0,

	curTag: "",

	googleMapsLoaded: false,

	lastClick: {}
};