<script>
import $store from "./store.js"
import $bus from "../bus.js"
import WolSpinner from "../common/WolSpinner.vue"
import {FIX_TIME, ERROR, LOG} from '../logs.js'
import { weekNumToYear } from './yearWeeks.js'
import CompanionItem from "./CompanionItem.vue"
import MsgList from "./MsgList.vue"

export default {
    components: { WolSpinner, CompanionItem, MsgList },

    data() {
        return {
            store: $store,
            curComp: null,
            busyGetMoreMessages: false
        }
    },

    computed: {
        allNames() {
            return this.store.companionsData.map(x => x._id);
        }
    },

    created() {
        FIX_TIME("MsgApp created");
        this.store.loading = true;
        this.getCompanionsData();        
    },

    mounted() {
        $bus.$on("save-comp", this.saveComp);
        $bus.$on("merge", this.merge);
        $bus.$on("get-messages", this.getMessages);
    },

    methods: {
        async getCompanionsData() {
            try {
                const response = await axios.get(`/api/msg/chats`);
                var data = response.data;
                data.forEach(item => {
                    item.companion = item.companion && item.companion.length > 0 ? item.companion[0] : {name: item._id};
                    if (item.companion) {
                        let comp = item.companion;
                        comp.sex = comp.sex || "unknown";
                        comp.full_name = comp.full_name || "";
                        comp.note = comp.note ||"";
                        comp.group = comp.group || "";
                    }
                    item.edited = false;
                    item.merged = false;
                    item.messages = [];
                    item.offset = 0;
                });
                this.store.companionsData = data;
                this.store.loading = false;
            } catch (ex) {
                ERROR("getCompanions", "error", ex);
            }
        },

        async saveComp(comp) {
            try {
                delete comp.v__;
                await axios.post(`/api/msg/chats`, comp);
                LOG("saveComp", `Companion ${comp.name} successfully saved`, true);
            } catch (err) {
                ERROR("saveComp", "error", err);
            }
        },

        async merge(from, to) {
            if (from && to && from != to && this.allNames.includes(to)) {
                if (confirm(`Вы хотите слить сообщения ${from} с ${to}?`)) {
                    await axios.post(`/api/msg/chats/rename`, {oldName: from, newName: to});
                    LOG("saveComp", `Companion ${from} was successfully merged with ${to}`, true);
                    this.store.companionsData = [];
                    await this.getCompanionsData();
                }
            }
        },

        async getMessages(_id) {
            try {
                let comp = this.store.companionsData.find(x => x._id == _id);
                if (!comp) {
                    return;
                }
                if (comp.messages.length > 0) {
                    this.curComp = comp;
                } else {
                    const response = await axios.get(`/api/msg/chat/${_id}`);
                    let curMessages = response.data;
                    comp.messages = curMessages;
                    this.curComp = comp;
                }
            } catch (e) {
                 ERROR("getMessages", "error", err, 1);
            }
        }, 

        async getMoreMessages() {
            if (!this.curComp || !this.curComp.messages.length || this.busyGetMoreMessages)
                return;

            try {
                this.busyGetMoreMessages = true;
                const response = await axios.get(`/api/msg/chat/${this.curComp._id}?offset=${this.curComp.offset+1}`);
                const newMessages = response.data;
                if (newMessages && newMessages.length > 0) {
                    this.curComp.messages = this.curComp.messages.concat(response.data);
                    this.curComp.offset++;
                    LOG("getMoreMessages", `gotten more messages for _id ${this.curComp._id}, offset now ${this.curComp.offset}`);
                }
            } catch (err) {
                ERROR("getMoreMessages", "error", err, 1);
            }
            finally {
                this.busyGetMoreMessages = false;
            }
        }
    }
}
</script>
<template id="template">
    <div class="app-layout">
        <wol-spinner :store="store"></wol-spinner> 
        <div class="msg-container">       
            <ul class="card-container"  v-show="!store.loading">
                <li v-for="item in store.companionsData" :key="item._id">
                   <companion-item :item="item"></companion-item> 
                </li>
            </ul>
        </div>
        <div id="msg_list" style="position:fixed; right:50px; top:50px;" v-if="curComp && curComp.messages.length > 0">
            <msg-list :messages="curComp.messages" :name="curComp._id" :mh="800" @scroll-down="getMoreMessages()"></msg-list>
        </div>
    </div>
</template>

<style lang="less">
@import "../common/wol-vars.less";
@import "../common/wol-basic.less";

.msg-container {
    padding-top:50px;
}

ul.card-container {
    width: 1400px;
    margin: 0 auto;

    li {
        display: inline-block;
        vertical-align: top;
    }
}


.md-table-head-container {
    height: 30px;
}
</style>

