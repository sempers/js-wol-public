var vm = new Vue({
    el: "#vwol",

    template: `
    <div style="display:flex;padding-top:50px;justify-content:center;">
            <wol-navbar :current="'msg'"></wol-navbar>
            <wol-spinner :store="$store.state"></wol-spinner>            
            <div class="md-layout md-gutter" style="max-height:800px" v-show="!$store.state.loading">
                <div class="md-layout-item" style="overflow-y:scroll;width:50%">
                    <md-table>
                        <md-table-row>
                            <md-table-head>#</md-table-head>
                            <md-table-head>Пол</md-table-head>
                            <md-table-head>Чат</md-table-head>
                            <md-table-head>Сообщений</md-table-head>
                            <md-table-head>Годы</md-table-head>
                        </md-table-row>
                        <md-table-row @click.left="selectMatch(chat)" @click.right.prevent="changeSex(chat)" v-for="(chat, index) in $store.state.chats">
                            <md-table-cell style="width:30px">{{index+1}}</md-table-cell>
                            <md-table-cell style="width:30px" ><span v-if="chat.stats">
                                <md-icon :class="{'icon-man': chat.stats.sex == 'man', 'icon-woman': chat.stats.sex == 'woman', 'icon-unknown': chat.stats.sex == 'unknown'}">face</md-icon>
                            </span></md-table-cell>
                            <md-table-cell style="max-width:100px" >{{chat._id}}</md-table-cell>
                            <md-table-cell md-numeric style="width:80px">{{chat.cnt}}</md-table-cell>
                            <md-table-cell ><span v-if="chat.stats">{{chat.stats.years}}</span></md-table-cell>
                        </md-table-row>
                    </md-table>
                </div>
                <div class="md-layout-item" style="overflow-y:scroll">
                    <md-table>
                        <md-table-row>
                            <md-table-head>Было</md-table-head>
                            <md-table-head>Стало</md-table-head>
                        </md-table-row>
                        <md-table-row v-for="rule in $store.state.rules" class="md-dense" @dblclick="removeRule(rule)">
                            <md-table-cell>{{rule.match}}</md-table-cell>
                            <md-table-cell>{{rule.target}}</md-table-cell>
                        </md-table-row>
                        <md-table-row >
                            <md-table-cell><md-field><md-input v-model="$store.state.nRule.match" placeholder="Match"></md-input></md-field></md-table-cell>
                            <md-table-cell><md-field><md-input v-model="$store.state.nRule.target" placeholder="Target" @keyup.enter="addRule()"></md-input></md-field></md-table-cell>
                        </md-table-row>
                    </md-table>
                </div>
                <div class="md-layout-item" style="max-width:100px">
                    <md-button class="md-accent md-raised" @click="correct()">Correct</md-button>
                    <div class="chat-cntnr" style="left:0;max-height:720px;overflow-y:scroll;" v-show="$store.state.messages.length > 0" >
                        <ul class="chat-column">
                            <li class="msg" v-for="msg in $store.state.messages" :class="{me: !msg.isin}">
                                <div class="msg-inner">
                                    <div class="msg-header">
                                        <img class="channel-icon" :src="'/img/icon/' + msg.chan + '.png'" />
                                        <span class="msg-sender">{{msg.sndr}}</span>                                        
                                        <span class="msg-date">{{msg.date | fmtDate}}</span>
                                        <!--<div style="cursor:hand;float:right;" @click="deleteMessage(msg)">[x]</div>-->
                                    </div>
                                    <div class="msg-text" v-html="msg.text" ></div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
		</div>
    `,

    store: $store,

    created() {
        this.$store.dispatch('getChats');
        this.$store.dispatch('getRules');
    },

    methods: {
        changeSex(chat) {
            if (!chat.stats) {
                this.$store.commit('initChatStats', {name: chat._id});
            }
            this.$store.dispatch('changeSex', {name: chat._id});
        },

        addRule() {
            if (!(this.$store.getters.canAddRule))
                return;
            this.$store.dispatch('addRule');
        },

        removeRule(rule) {
            if (!rule)
                return;
            this.$store.dispatch('removeRule', rule);
        },

        selectMatch(chat) {
            this.$store.dispatch('selectMatch', chat);
        },

        correct() {
            this.$store.dispatch('correct');
        },

        deleteMessage(msg) {
            this.$store.dispatch('deleteMessage', msg);
        }
    },

    filters: {
        fmtDate(date) {
            return moment(date).local().format('DD.MM.YYYY HH:mm:ss');
        }
    }
});