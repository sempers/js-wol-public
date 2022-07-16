<script>
import moment from 'moment';
import m from '../../public/lib/underscore-min';

export default {
    data() {
        return { 
            scrollUp: false
        };
    },

    props: ["name", "messages", "mh"],
    
    watch: {
        name: {
            immediate: false,
            handler(newName, oldName) {
                /*if (newName && oldName && newName !== oldName) {
                    scrollUp = true;
                }*/
            }
        },

        messages: {
            immediate: true,
            handler(a, b) {
                this.insertDateBreaks(a, b);
            }
        }
    },

    /*updated() {
        if (this.messages && this.messages.length && this.scrollUp) {
            document.getElementById("chat_column").scrollTop = 0;
            this.scrollUp = false;
        }
    },*/

    computed: {
        maxHeight() {
            return (this.mh || 500) + "px";
        }
    },

    methods: {
        insertDateBreaks(a) {
            if (a && a.length) {
                for (let i = 0; i < a.length - 1; i++) {
                    let cur = a[i];
                    let next = a[i+1];
                    if (next.dateBreak || cur.dateBreak)
                        continue;
                    let nextDate = moment(next.date).local().format("DD.MM.YYYY");
                    let curDate = moment(cur.date).local().format("DD.MM.YYYY");
                    if (i === 0) {
                        a.splice(i, 0, { dateBreak: true, date: curDate})
                    } else if (curDate != nextDate)
                    {
                        a.splice(i+1, 0, { dateBreak: true, date: nextDate});
                    }
                }
            }
        },

        onScroll({ target: { scrollTop, clientHeight, scrollHeight }}) {
            if (scrollTop + clientHeight >= scrollHeight * 0.66) {
                this.$emit("scroll-down");
            }
        }        
    }
}
</script>
<template>
<div class="md-layout-item" v-show="messages.length > 0" >
    <ul class="chat-column" id="chat_column" :style="{'max-height': maxHeight}" @scroll="onScroll">
        <li class="msg" v-for="msg in messages" :class="{'me': !msg.isin && !msg.dateBreak, 'date-break': msg.dateBreak}">
            <div class="msg-inner" v-if="msg.dateBreak">{{msg.date}}</div>
            <div class="msg-inner" v-if="!msg.dateBreak">
                <div class="msg-header">
                    <div class="channel-icon" :class="msg.chan"></div>
                    <div class="msg-sender">{{msg.sndr}}</div>
                    <span class="msg-date">{{msg.date | fmtDate}}</span>
                </div>
                <div class="msg-text" v-html="msg.text"></div>
            </div>
        </li>
    </ul>
</div>
</template>
<style lang="less">
@import "../common/wol-vars.less";
@import "../common/wol-icons.less";

ul.chat-column {
    width: 380px;
    list-style: none;
    margin: 0 0 0 auto;
    padding: 0 6px;
    background-color: lightblue;
    border-radius: 4px;
    border: 1px solid #333;
    max-height: 460px;
    overflow-y: scroll;
}

li.msg {
    width: 100%;
    margin: 3px 0;
}


.msg-inner {
    background-color: white;
    box-sizing: border-box;
    max-width: 280px;
    border-radius: 4px;
    padding: 4px;
    margin: 0;
    display: inline-block;
    text-align: left;
}

li.msg.me {
    text-align: right;

    .msg-inner {
        background-color: lightyellow;
    }
}

li.msg.date-break {
    text-align: center;
    margin-top: 15px;
    margin-bottom: 6px;

    &:first-child {
        margin-top: 8px;
    }

    .msg-inner {
        background-color: #777;
        color: white;
        border-radius: 16px;
        font-size: 11px;
        padding: 0 8px;
    }
}

.chat-title {
    font-size: 16px;
    font-weight: bold;
    padding-top: 5px;
    color: #333;
}

.channel-icon {
  width: 12px;
  height: 12px;
  display: inline-block;
}

.msg-header {
  height: 10px;
  line-height: 10px;
  vertical-align: middle;
}

.msg-sender {
    color: #555;
    font-size: 11px;
    font-weight: bold;
    display: inline-block;
    vertical-align: top;
    margin-top: 1px;
}

.msg-date {
  color: gray;
    font-size: 10px;
    float: right;
    margin-left: 8px;
    margin-top: 2px;
}

.msg-text {
  font-size: 11px;
  line-height: 14px;
  margin-top: 6px;
  overflow: hidden;
}
</style>