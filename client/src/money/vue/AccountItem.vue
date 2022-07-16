<script>
import $store from '../store.js'
import $bus from '../../bus.js'
import Balance from './Balance.vue'
import CatIcon from './CatIcon.vue'

export default {
    components: { Balance, CatIcon },

    props: ["account"],

    data() {
         return {
            store: $store,
            edited: false,
            oldName: "",
            oldHidden: false
        }
    },

    methods: {
        edit() {
            if (this.edited) {
                this.account.name = this.oldName;
            } else {
                this.oldName = this.account.name;
                this.oldHidden = this.account.hidden;
            }
            this.edited = !this.edited;
        },

        onKeyDown(event) {
            if (event.key == "Enter" && !event.altKey && !event.shiftKey && !event.ctrlKey) {
                event.preventDefault();
                this.save();
            }
        },

        save() {
            $bus.$emit("account-saved", this.account);
            if (this.oldName != this.account.name) {
                this.edited = false;
                $bus.$emit("account-renamed", {
                    oldName: this.oldName,
                    newName: this.account.name
                });
            }
            this.edited = false;
        },

        toggle() {
            $bus.$emit("account-toggled", this.account);
        },

        select() {
            if (this.store.cur.account && this.store.cur.account.name == this.account.name)
                return;
            $bus.$emit("account-selected", this.account);
        }
    }
}
</script>

<template>
     <div class="acc-item" @click.ctrl.prevent="toggle()" @click.right.prevent="edit()" @click="select()" :class="{'active': store.cur.account && store.cur.account.name == account.name, 'hidden':account.hidden}" >
        <cat-icon :category="account.category" :currency="account.currency"></cat-icon>
        <div class="account-name" v-show="!edited">{{account.name}}</div>
        <md-field style="width:70px;" v-show="edited">
            <md-input v-model.lazy="account.name" @keydown="onKeyDown($event)" ></md-input>
        </md-field>
        <md-field style="width:25px;" v-show="edited">
            <md-input v-model.number.lazy="account.sort" @keydown="onKeyDown($event)"></md-input>
        </md-field>
        <md-checkbox class="hide-checkbox" v-model="account.hidden" v-show="edited">Hide</md-checkbox>
        <balance v-show="!edited" :amount="account.balance" :currency="account.currency"  v-if="account.currency == 'RUB'"></balance>
        <balance v-show="!edited" :amount="account.balance" :currency="account.currency" :secondary="'RUB'" v-else></balance>
    </div>
</template>

<style lang="less">
.acc-item {
    box-sizing: border-box;
    height: 48px;
    width: 250px;
    padding: 15px 16px 16px 10px;
    display: block;

    &.hidden {
        color: #ccc;
    }

    &.active {
        font-weight: bold;
        background-color: #d0d0d0;
    }

    &:hover:not(.active) {
        background-color: #e4e4e4;
    }

    .md-field {
        margin-bottom:0;margin-top:-5px;padding:0;display:inline-block;
    }
}

.hide-checkbox {
    float: right;
    display: inline-flex;
    margin: 0;
}
.account-name {
    overflow: hidden;
    word-break: break-all;
    float: left;
}
.account-item {
    box-sizing: border-box;
    height: 48px;
    width: 250px;
    padding: 15px 16px 16px 10px;
    display: block;

    &.hidden {
        color: #ccc;
    }

    &.active {
        font-weight: bold;
        background-color: #d0d0d0;
    }

    &:hover:not(.active) {
        background-color: #e4e4e4;
    }

    .md-field {
        margin-bottom:0;margin-top:-5px;padding:0;display:inline-block;
    }
}

.md-checkbox .md-checkbox-label {
    padding-left: 12px;
}

.hide-checkbox {
    float: right;
    display: inline-flex;
    margin: 0;
}
</style>
