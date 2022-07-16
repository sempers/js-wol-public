const paramsStr = document.body.getAttribute("serverparams")?.split(";");

const $server = {
    NAME: paramsStr[0] || "alex",
    MODULES: paramsStr[1]?.split(",") || "wol",
    USE_LOCAL_SERVER: Boolean(paramsStr[2]) || true,    
    BASE_URL: paramsStr[3] || "",    
};

Vue.use(VueMaterial.default);

if (window.VueRouter)
    Vue.use(VueRouter);

if (window.Vuex)
    Vue.use(Vuex);

const $bus = new Vue();

Vue.filter("fmtDate", date => moment(date).local().format('DD.MM.YYYY HH:mm:ss'));

Vue.component('wol-navbtn', {
    props: ['link', 'icon', 'text', 'current'],
    template: `<div class='wol-navbtn'><a :href="link"><md-icon style="position:relative;top:-3px">{{icon}}</md-icon>&nbsp;{{text}}</a></div>`
});

Vue.component('wol-navbar', {
    props: ['current'],
    data() {
        return  {
            modules: $server.MODULES
        }
    },
    template: `<div class="wol-navbar">
                    <wol-navbtn v-show="modules.includes('wol')" :icon="'directions_run'" :class="{'active': current == 'wol'}" :link="'/'" :text="'Weeks of Life'"   ></wol-navbtn>
                    <wol-navbtn v-show="modules.includes('money')" :icon="'monetization_on'" :class="{'active': current == 'money'}":link="'/money'" :text="'Money'"  ></wol-navbtn>
                    <wol-navbtn v-show="modules.includes('msg')" :icon="'message'" :class="{'active': current == 'msg'}" :link="'/msg'" :text="'Messages'"  ></wol-navbtn>                    
                    <wol-navbtn v-show="current == 'wol' && modules.includes('travel')" :icon="'location_on'" :link="'javascript:;'" @click.native.capture="emit('show-map-dialog')" :text="'Travel'" ></wol-navbtn>
                    <!--<wol-navbtn v-show="current == 'wol'" :icon="'local_hospital'" :class="{'active': current=='pills'}" @click.native.capture="emit('show-pills-dialog')" :text="'Pills'"></wol-navbtn>-->
                    <wol-navbtn v-show="current == 'wol' || current == 'money'" :icon="'exit_to_app'" :link="'javascript:;'" @click.native.capture="emit('logout')" :text="'Log out'"></wol-navbtn>
                </div>`,
    methods: {
        emit(key) {
            $bus.$emit(key);
        } 
    }    
});

Vue.component('wol-spinner', {
    props: ['store'],
    template: `
    <div class="spinner-parent" v-if="store.loading">
        <div class="spinner-elem">
            <md-progress-spinner md-mode="indeterminate" :md-diameter="160"></md-progress-spinner>
        </div>
    </div>
    `
});