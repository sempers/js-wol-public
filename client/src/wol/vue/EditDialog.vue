<script>
import $store from "../store.js";
import MsgList from "../../msg/MsgList.vue";

export default {
    components: { MsgList },

    props: ["week"],

    data() {
        return {
            store: $store,
            changingWeeks: false
        }
    },

    computed: {
        c_tagIcons() {
            return this.week ? this.week.getTagIcons(): []
        }, 

        c_photos() {
            return this.week ? this.week.photos.sortBy(x => x.totalDate): [];
        }
    },

    watch: {
        week(newValue) {
            if (newValue) {
                this.week.curChat = { messages: [], chat: "" }; // clearCurChat
                this.$nextTick(() => {                          // adjustArea
                    let el = document.getElementById("week_info_textarea");
                    if (el) {
                        el.style.height = "1px";
                        el.style.height = `${Math.round(el.scrollHeight) + 6}px`;
                    }                
                });
                this.week.editInfo = this.week.info;
                this.changingWeeks = true;
            }
        }
    },

    created() {

    },

    updated() {
        if (this.changingWeeks) {
            this.changingWeeks = false;
        }
    },

    methods: {
         showChat(chat) {
            this.week.curChat = chat;
            document.getElementById("chat_column").scrollTop = 0;       
        },

        keyDown(event) {
            if (!this.$root.client.isMobile &&
                event.key == "Enter" &&
                !event.altKey &&
                !event.shiftKey &&
                !event.ctrlKey
            ) {
                event.preventDefault();
                this.save(true);
            } else {
                if (event.keyCode == 39 && event.ctrlKey) {
                    //right arrow
                    this.goNext();
                }
                if (event.keyCode == 37 && event.ctrlKey) {
                    //left arrow
                    this.goPrevious();
                }
            }
        },

        loadBigPreview(photo) {
            this.$emit("load-preview", photo);
        },

        save(doExit) {
            this.$emit("week-saved");
            if (doExit) {
                this.store.shownEditDialog = false;
            }
        },

        showMessages() {
            this.week.photoShown = false;
            if (this.week.messages.length) {
                this.week.msgShown = !this.week.msgShown;
            }            
        },

        showPhotos() {
            this.week.msgShown = false;
            if (this.week.photos.length) {
                this.week.photoShown = !this.week.photoShown;
            }
        },        

        saveManualDate(photo) {
            photo.edited = false;
            this.$emit("save-photo", photo);
        },

        editManualDate(photo) {
            if (photo.edited) {
                photo.edited = false;
            } else {
                if (photo.manual_date) {
                    photo.manual_date = "";
                }
                photo.edited = true;            
            }
        }
    }
}
</script>

<template>
	<md-dialog id="editDialog" :md-active.sync="store.shownEditDialog" v-if="week">
        <md-dialog-content>
            <div class="pl md-title">{{week.desc}}</div>

            <div class="action-btn" @click="store.shownEditDialog = false">
                <md-button class="md-icon-button md-dense">
                    <md-icon>clear</md-icon>
                </md-button>
            </div>
            <div class="action-btn" @click="$emit('next-week')">
                <md-button class="md-icon-button md-dense">
                    <md-icon>arrow_forward</md-icon>
                </md-button>
            </div>
            <div class="action-btn" @click="$emit('prev-week')">
                <md-button class="md-icon-button md-dense">
                    <md-icon>arrow_back</md-icon>
                </md-button>
            </div>

            <div class="colored-flags">
                <ul style="margin:0">
                    <li class="colored-flag" v-for="cf in week.coloredFlags" :style="'background-color:' + cf.color">{{cf.name}}</li>
                </ul>
            </div>

            <div class="tag-icons" v-if="c_tagIcons.length > 0">
                <div class="wi-icon-placeholder" v-for="tagicon in c_tagIcons" :class="tagicon"></div>
            </div>

            <md-field>
                <label>Описание</label>
                <md-textarea id="week_info_textarea" ref="week_info_textarea" v-model="week.editInfo" @keydown="keyDown($event)" md-autogrow></md-textarea>
            </md-field>

            <div id="msgArea" v-if="week.msgShown">
                <div class="msg-container">
                    <div v-if="!week.messages || !week.messages.length" class="no-messages">
                        <p>Сообщений не найдено</p>
                    </div>
                    <div class="md-layout md-gutter">
                        <div class="md-layout-item names-column">
                            <md-table>
                                <md-table-row v-for="(chat, index) in week.messages" :key="chat.chat" @click="showChat(chat)">
                                    <md-table-cell style="cursor:pointer">{{chat.chat}} ({{chat.messages.length}})</md-table-cell>
                                </md-table-row>
                            </md-table>                 
                        </div>
                        <msg-list :messages="week.curChat.messages" :name="week.curChat.chat"></msg-list>
                    </div>
                </div>
            </div>

            <div id="photoGallery" v-if="week.photoShown">
                <div v-for="photo in c_photos" :key="photo.resource_id" class="ib">
                    <div class="photo" >
                        <div class="photo-date">{{photo.totalDate | date}} <input placeholder="DD.MM.YYYY" class="manual-date-input" v-model="photo.manual_date" v-show="photo.edited" v-on:keyup.enter="saveManualDate(photo)"/></div>                   
                        <img class="photo-thumb" style="" :class="{'removed': photo.removed}" v-bind:src="photo.thumb" @click.left="loadBigPreview(photo)" @click.right.prevent="editManualDate(photo)" />                    
                    </div>
                </div>
            </div>

        </md-dialog-content>
        <md-dialog-actions>
            <md-button @click="showPhotos()" :disabled="!week.photoCount || week.photoLoading">Фотографии <span v-show="week.photoLoading"> ... </span><span v-show="week.photoCount">({{week.photoCount}})</span></md-button>
            <md-button @click="showMessages()" :disabled="!week.msgCount || week.msgLoading">Cообщения <span v-show="week.msgLoading"> ... </span><span v-show="week.msgCount">({{week.msgCount}})</span></md-button>
            <md-button @click="save(false)">Сохранить</md-button>
            <md-button @click="save(true)">Сохранить и закрыть</md-button>
        </md-dialog-actions>
    </md-dialog>
</template>

<style lang="less">
@import "../../common/wol-vars.less";
@import "../../common/wol-icons.less";

#editDialog {
    /*min-height: 320px;*/
    .md-dialog-content:first-child {
        padding-top: 22px;
        width: 800px !important;
    }
}

#msgArea {
    min-height: 460px;
}

#photoGallery {
    max-height: 460px;
    overflow-y: scroll;
}

img.photo-thumb {
    display:inline-grid;

    &:hover {
        opacity: 0.6;
        cursor: pointer;
    }

    &.removed {
        opacity: 0.75;
    }
}

.photo-date {
    margin-bottom: 2px;
}

.manual-date-input {
    opacity: 0.5;
    width: 90px;
    float:right
}

.photo {
    padding: 2px;
    margin: 8px;
    font-size: 9px;
    display: inline-block;
}

.msg-container {
    clear:both;
    padding: 10px 12px 12px 12px;
}

.no-messages {
    height: 150px;
    text-align:center;
    vertical-align:middle;
}

.names-column {
    max-width: 280px;
    max-height: 460px;
    overflow-y: auto;
}

@media (max-width:1080px) {
    #editDialog .md-dialog-content:first-child {
        padding-top: 22px;
        width: 600px !important;
    }

    .hide-mobile {
        display: none;
    }
}

#week_info_textarea {
    font-size: 14px;
    line-height: 26px;
    min-height: 80px;
    max-height: 250px !important;
    overflow-y: auto !important;
    padding-bottom: 6px;
}

.colored-flag {
    display: inline-flex;
    margin-right: 4px;
    justify-content: center;
    border-radius: 4px;
    color: #333;
    font-size: 12px;
    align-items: center;
    box-sizing: border-box;
    padding: 0 4px;
}

.colored-flags {
    float: right;
    position: relative;
    top: -2px;
    margin-right: 5px;
}

.tag-icons {
    float: right;
    display: inline-flex;
    height: 20px;
    align-items: center;
    background-color: #f0f0f0;
    margin-right: 4px;
    padding: 0 4px 0 4px;
}

.action-btn {
    float: right;
    position: relative;
    top: -8px;
}

.action-btn button {
    margin: 2px;
}

.action-btn .md-button .md-ripple {
    padding-left: 8px;
    padding-right: 8px;
    padding-top: 4px;
    display: inline-block;
    margin: 0;
}

.wi-icon-placeholder {
    width: 12px;
    height: 12px;
    margin-right: 4px;
    display: inline-block;
    vertical-align: middle;
    border: 1px solid @window-background;

    &:last-child {
        margin-right: 0;
    }
}
</style>

