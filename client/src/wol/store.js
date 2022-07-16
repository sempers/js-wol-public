export default {
	client: {
		isMobile: false
	},

	loading: false,

	weeks: [],

	years: {},

	firstYearPlaceHolderWidth: 0,

	tags: {
		stats: [],
		searched: ''
	},

	curWeek: null,

	curTag: "",

	curMessages: [],

	curPhoto: null,

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
	shownPhotoDialog: false,

	googleMapsLoaded: false,

	test: { wiTimes: []	}
}