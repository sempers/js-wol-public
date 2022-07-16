import Vue from "vue"
import VueMaterial from "vue-material"
import VueRouter from "vue-router"

Vue.use(VueMaterial);
Vue.use(VueRouter);

import $config from './config.js'

Vue.filter("fmtDate", date => moment(date).local().format('DD.MM.YYYY HH:mm:ss'));
Vue.filter("date", d => { try { return moment(d).format("DD.MM.YYYY"); } catch { return "n\a"; } });
Vue.filter("fmtAmount", );

import WolApp from "./wol/vue/WolApp.vue"
import MoneyApp from "./money/vue/MoneyApp.vue"
import MsgApp from "./msg/MsgApp.vue"
import LoginApp from "./login/LoginApp.vue"
import WolNavbar from "./common/WolNavbar.vue"
import $bus from "./bus.js"
import { authenticate, logout } from "./fb.js"

axios.defaults.baseURL = $config.baseUrl;

const userData = {
    user: null
};

const router = new VueRouter({
    routes: [
        {
            name: "login",
            path: "/login",
            component: LoginApp
        },
        {
            name: "wol",
            path: "/",
            component: WolApp,
            
        },
        {
            name: "money",
            path: "/money",
            component: MoneyApp,                
        },
        {
            name: "msg",
            path: "/msg",
            component: MsgApp,                
        }
    ],                      
});

router.beforeEach((to, from, next) => {
    if (to.name != "login" && !userData.user) {
        authenticate(
            (user) => { userData.user = user;  next(); },
            () =>     { userData.user = null;  next({name: "login"});}
        );    
    } else {
        next();
    }
});

window.vm = new Vue({
    el: "#app",

    template: `
	<div>
		<wol-navbar :current="current" v-if="authenticated"></wol-navbar>
        <keep-alive>
		    <router-view></router-view>
        </keep-alive>
	</div>
	`,

    components: {
        WolNavbar,
        WolApp,
		MoneyApp,
		MsgApp,
        LoginApp
    },

    data() {
        return {
            config: $config,
            client: { isMobile: false},
            userData: userData
        };
    },

    computed: {
        current() {
            return this.$route.path.replace("/", "") || "wol";            
        },

        authenticated() {
            return this.userData.user != null;
        }    
    },

    created() {
        const device = new UAParser().getDevice();
        this.client.isMobile = device && (device.type == "mobile" || device.type == "tablet");
        $bus.$on("logout", this.logout);
    },

    methods: {
        logout() {
            logout(() => {window.location.href= "/#/login";});
        }
    },

    router
});