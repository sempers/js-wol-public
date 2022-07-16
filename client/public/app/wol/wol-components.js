Vue.component("WeekItem", {
    props: ['week'],

    data() {
        return {
            mounted: false,
            created: 0,
            updated: 0,
        }
    },

    computed: {
        tags() {
            return this.week.getTags({
                stripped: true,
                asString: true
            });
        }
    },

    template: `
        <div class="wi-outer" :class="{selected: week.selected, infoed: !!week.info, tagged: week.tagged}" @click="onClick()">
            <div class="wi-inner" :class="week.future">
                <template v-if="!week.future">
                    <div class="wi-bg" :style="'background-color:' + week.bgcolor"></div>
                    <div class="wi-bg2" :style="'border-bottom: 12px solid '+ week.bgcolor2" v-if="week.bgcolor2"></div>
                    <div class='wi-icon' :class="tags"></div>
                </template>
                <div class="wi-popup-triangle"></div>
                <div class="wi-popup md-elevation-4" >
                    <span class="desc" >{{week.desc}}</span>&nbsp;
                    <div  class="desc-flags" >{{week.flags}}</div>
                    <div  class="desc-info">{{week.info}}</div>
                </div>
            </div>
        </div>
        `,

    methods: {
        onClick() {
            this.$emit("week-clicked", this.week);
        }
    },

    created() {
        this.$emit("week-created", this.week);
        this.created = (new Date()).getTime();
    },

    mounted() {
        $bus.$emit("wit", (new Date()).getTime() - this.created);
    }
});

Vue.component("MapDialog", {
    data() {
        return {
            store: $store
        }
    },
    template: `
		<md-dialog id="mapDialog" :md-active.sync='store.shownMapDialog'>
			<md-dialog-content>
				<div id="map"></div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click='store.shownMapDialog = false'>Закрыть</md-button>
			</md-dialog-actions>
		</md-dialog>
	`
});

Vue.component("EditDialog", {
    data() {
        return {
            store: $store,
            isMobile: false
        }
    },
    computed: {
        tagicons() {
            if (this.store.curWeek.getTags)
                return this.store.curWeek.getTags({
                    stripped: true,
                    asString: false,
                    hasPng: true
                });
            else
                return [];
        }
    },
    template: `
	<md-dialog id="editDialog" :md-active.sync="store.shownEditDialog" >
			<md-dialog-content>
                <div class="pl md-title">{{store.curWeek.desc}}</div>
                <div class="action-btn" @click="store.shownEditDialog = false">
                    <md-button class="md-icon-button md-dense">
                        <md-icon>clear</md-icon>
                    </md-button>
                </div>
                <div class="action-btn hide-mobile" @click="goNext()">
                    <md-button class="md-icon-button md-dense">
                        <md-icon>arrow_forward</md-icon>
                    </md-button>
                </div>
                <div class="action-btn hide-mobile" @click="goPrevious()">
                    <md-button class="md-icon-button md-dense">
                        <md-icon>arrow_back</md-icon>
                    </md-button>
                </div>
                <div class="colored-flags hide-mobile">
                    <ul style="margin:0">
                        <li class="colored-flag" v-for="cf in store.curWeek.coloredFlags" :style="'background-color:' + cf.color">{{cf.name}}</li>
                    </ul>
                </div>
                <div class="tag-icons" v-if="tagicons.length > 0">
                    <div class="wi-icon-placeholder" v-for="tagicon in tagicons" :class="tagicon"></div>
                </div>
				<md-field>
					<label>Описание</label>
					<md-textarea id="week_info_textarea" ref="week_info_textarea" v-model="store.curWeek.editInfo" @keydown="onKeydown($event)" md-autogrow></md-textarea>
				</md-field>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="onShowMessages()" :disabled="!store.curWeek.msgCount">Cообщения <span v-show="store.curWeek.msgLoading">...</span><span v-show="store.curWeek.msgCount">({{store.curWeek.msgCount}})</span></md-button>
				<md-button @click="onSave(false)">Сохранить</md-button>
				<md-button @click="onSave(true)">Сохранить и закрыть</md-button>
			</md-dialog-actions>
		</md-dialog>
	`,

    mounted() {
        $bus.$on("curweek-changed", this.adjustArea);
        const device = (new UAParser()).getDevice();
        this.isMobile = device && (device.type == 'mobile' || device.type == 'tablet');
    },

    methods: {
        onKeydown(event) {
            if (!this.isMobile && event.key == "Enter" && !event.altKey && !event.shiftKey && !event.ctrlKey) {
                event.preventDefault();
                this.onSave(true);
            } else {
                if (event.keyCode == 39 && event.ctrlKey) { //right arrow
                    this.goNext();
                }
                if (event.keyCode == 37 && event.ctrlKey) { //left arrow
                    this.goPrevious();
                }
            }
        },

 

        adjustArea() {
            this.$nextTick(() => {
                const el = document.getElementById("week_info_textarea");
                if (el) {
                    el.style.height = "1px";
                    el.style.height = `${Math.round(el.scrollHeight) + 6}px`;
                }
            });
        },

        goPrevious() {
            if (this.store.curWeek.weekNum > 1) {
                $bus.$emit("prev-week");
            }
        },

        goNext() {
            $bus.$emit("next-week");
        },

        onSave(exit) {
            $bus.$emit("week-saved");
            if (exit) {
                this.store.shownEditDialog = false;
            }
        },

        onShowMessages() {
            if (this.store.curWeek.messages.length) {
                $bus.$emit("show-messages", this.store.curWeek.messages);
            }
        }
    }
});

Vue.component("MessageDialog", {
    data() {
        return {
            store: $store,
            curChat: {
                messages: [],
                chat: ""
            }
        }
    },

    template: `
        <md-dialog id="msgDialog" class="msg-dialog" :md-active.sync="store.shownMessageDialog">
          <md-dialog-content>
            <div class="pl md-title">{{store.curWeek.desc}}</div>
            <div class="action-btn" @click="store.shownMessageDialog = false">
              <md-button class="md-icon-button md-dense">
                <md-icon>clear</md-icon>
              </md-button>
            </div>
            <div style="clear:both;padding-top:12px;padding-bottom:12px">
                <div v-if="!store.curWeek || !store.curWeek.messages || !store.curWeek.messages.length" style="height:150px;text-align:center;vertical-align:middle">
                    <p>Сообщений не найдено</p>
                </div>
                <div class="md-layout md-gutter">
                    <div class="md-layout-item names-column" >
                        <md-table>
                            <md-table-row v-for="(chat, index) in store.curWeek.messages" :key="chat.chat" @click="showChat(chat)">
                                <md-table-cell style="cursor:pointer" >{{chat.chat}} ({{chat.messages.length}})
                                </md-table-cell>
                            </md-table-row>
                        </md-table>                 
                    </div>
                    <div class="md-layout-item" v-show="curChat.messages.length > 0" >
                        <ul class="chat-column" id="chat_column">
                            <li class="msg" v-for="msg in curChat.messages" :class="{me: !msg.isin}">
                                <div class="msg-inner">
                                <div class="msg-header">
                                    <img class="channel-icon" :src="'/img/icon/' + msg.chan + '.png'" />
                                    <span class="msg-sender">{{msg.sndr}}</span>
                                    <span class="msg-date">{{msg.date | fmtDate}}</span>
                                </div>
                                <div class="msg-text" v-html="msg.text"></div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
          </md-dialog-content>
	    </md-dialog>
    `,

    methods: {
        showChat(chat) {
            this.curChat = chat;
            document.getElementById("chat_column").scrollTop = 0;
        },

        clearCurChat() {
            this.curChat = {
                messages: [],
                chat: ""
            }
        }
    },

    mounted() {
        $bus.$on("curweek-changed", this.clearCurChat);
    }
});

Vue.component('PillsDialog', {
    data() {
        return {
            store: $store,
            obj: {
                lastSave: null,
                pills: []
            }
        }
    },

    template: `
        <md-dialog id="pillsDialog" :md-active.sync="store.shownPillsDialog">
            <md-dialog-content>
                <div class="ib">Последний пересчет: {{obj.lastSave | fmtDate}}</div>
                <md-button class="md-icon-button md-dense action-btn" @click="close()">
                    <md-icon>clear</md-icon>
                </md-button>
                <md-button class="md-icon-button md-dense action-btn" @click="save()">
                    <md-icon>done</md-icon>
                </md-button>
                <md-table class="pills-table">
                    <md-table-row>
                        <md-table-head>Препарат</md-table-head>
                        <md-table-head>1 таб (мг)</md-table-head>
                        <md-table-head>Доза (мг)</md-table-head>
                        <md-table-head>Количество</md-table-head>
                        <md-table-head>Закончится</md-table-head>
                    </md-table-row>
                    <md-table-row v-for="pill in obj.pills" :key="pill.name">
                        <md-table-cell >{{pill.name}}</md-table-cell>
                        <md-table-cell >{{pill.unit}}</md-table-cell>
                        <md-table-cell >{{pill.dose}}</md-table-cell>
                        <md-table-cell ><input type="text" v-model="pill.available" /></md-table-cell>
                        <md-table-cell >{{pill.finish}}</md-table-cell>
                    </md-table-row>
                </md-table>
            </md-dialog-content>
        </md-dialog>
    `,

    created() {
        var obj = JSON.parse(localStorage.getItem('wol_pills_obj'));
        if (!obj || !obj.lastSave) {
            //default
            obj = {
                lastSave: new Date(),
                pills: [
                    {
                        name: 'Арипипразол',
                        unit: 10,
                        dose: 10,
                        available: 30
                    },
                    {
                        name: 'Сертралин',
                        unit: 100,
                        dose: 200,
                        available: 30
                    },
                    {
                        name: 'Биперидин',
                        unit: 2,
                        dose: 2,
                        available: 100
                    },
                    {
                        name: 'Ламотриджин',
                        unit: 100,
                        dose: 300,
                        available: 30
                    },
                    {
                        name: 'Вальпроевая кислота',
                        unit: 300,
                        dose: 300,
                        available: 100
                    },
                    {
                        name: 'Тразодон',
                        unit: 150,
                        dose: 75,
                        available: 30
                    },
                    {
                        name: 'Вортиоксетин',
                        unit: 10,
                        dose: 10,
                        available: 30
                    }
                ]
            };
            localStorage.setItem('wol_pills_obj', JSON.stringify(obj));
        }
        this.obj = obj;
        this.count();
    },

    methods: {
        count() {
            this.obj.pills.forEach(pill => {
                let diffDays = Math.abs(Math.floor(moment(this.obj.lastSave).diff(moment(new Date()), 'days')));
                pill.available -= (pill.dose / pill.unit) * diffDays;
                if (pill.available < 0) {
                    pill.available = 0;
                }
                let days = Math.floor(pill.available * pill.unit / pill.dose);
                let ls = moment(this.obj.lastSave);
                ls.add(days, 'day');
                pill.finish = ls.local().format('D MMMM YYYY');
                this.obj.lastSave = new Date();
                LOG('count()', `Pills recounted at ${this.obj.lastSave}`)
            });
        },

        close() {
            this.count();
            localStorage.setItem('wol_pills_obj', JSON.stringify(this.obj));
            this.store.shownPillsDialog = false;
        },

        save() {
            this.count();
            localStorage.setItem('wol_pills_obj', JSON.stringify(this.obj));
            toastr.success('Pills saved');
        }
    }
});