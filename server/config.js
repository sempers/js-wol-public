var os = require("os");

module.exports = {
	USE_LOCAL_SERVER: !["W-BobchenkovAV2", "EOC"].includes(os.hostname()),
	NAME: process.env.NAME,

	serverParams() {
		const useLocalServer = !["W-BobchenkovAV2", "EOC"].includes(os.hostname());
		return { serverParams: `${process.env.FB_API_KEY};${process.env.NAME};${process.env.MODULES};${useLocalServer};${useLocalServer ? "" : process.env.BASE_URL}` };
	},

	oldServerParams() {
		return {
            FB_API_KEY: process.env.FB_API_KEY,
			NAME: process.env.NAME,
			MODULES: process.env.MODULES,
			USE_LOCAL_SERVER: !["W-BobchenkovAV2", "EOC"].includes(os.hostname()),
			BASE_URL: process.env.BASE_URL
		}
	}
}