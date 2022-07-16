<script>
import $store from "../store.js";
import $bus from "../../bus.js";
import Amount from "./Amount.vue";

export default {
    components: { Amount },

    data() {
        return {
            store: $store
        }
    },

    props: ["tag"],

    computed: {
        category() {
            return this.store.noAcc() ? "" : this.store.accCategory(this.store.cur.account.name)
        },

        currency() {
            return this.store.noAcc() ? "RUB" : this.store.accCurrency(this.store.cur.account.name)
        },

        color() {
            return this.store.tagColor(this.tag.bt.name);
        },

        type() {
            return this.store.noAcc() && this.tag.bt.name.includes("Invest") ? "transfer": "delta";
        }
    },

    methods: {
        select() {
            if (!this.tag.isEdited) {
                $bus.$emit("tag-selected", this.tag.bt.name);
            }
        },

        edit() {
            if (!this.tag.empty && this.tag.enabled && !this.tag.isEdited) {
                this.tag.isEdited = true;
                this.tag.oldName = this.tag.bt.name;
                this.tag.oldColor = this.tag.bt.color;
            }
        },

        cancel() {
            this.tag.isEdited = false;
            this.tag.isRemoved = false;
            this.tag.bt.name = this.tag.oldName;
            this.tag.bt.color = this.tag.oldColor;
        },

        makeRandom() {
            this.tag.bt.color = this.store.randomTagColor();
        },

        save() {
            $bus.$emit("tag-saved", Object.assign({}, this.tag.bt));
            if (this.tag.oldName != this.tag.bt.name) {
                if (!this.tag.bt.name && this.store.transactions.find(x => x.tag == this.tag.bt.name)) {
                    this.error(`[removeTag] There are transactions with tag ${this.tag.bt.name}`);
                    this.cancel();
                    return;
                }
                $bus.$emit("tag-renamed", {
                    oldName: this.tag.oldName,
                    newName: this.tag.bt.name
                });
            }
        },

        tryRemove() {
            this.tag.isRemoved = true;
        },

        remove() {
            $bus.$emit("tag-removed", this.tag.bt);
        }
    }
};
</script>
<template>
    <div class="tag-item" @click.left="select()" @click.right.prevent="edit()" :class="{'active': store.cur.tag == tag.bt.name, 'disabled': !tag.enabled}">
        <div class="tag-color" :style="{'background-color': color}"></div>
        <div class="tag-info" v-show="!tag.isEdited">
            <div class="tag-name">{{tag.bt.name}}</div>
            <div class="tag-budget" v-if="store.noAcc() && tag.budget.max && !(!store.cur.isMonthView && tag.budget.type == 'monthly')"
                :class="{'transfer': tag.budget.type=='yearly', 'income': tag.budget.type=='monthly' && tag.budget.percentage <= 100.0, 'expense': tag.budget.type=='monthly' && tag.budget.percentage > 100}">
                <span>{{tag.budget.spent}} / {{tag.budget.max}} ({{tag.budget.percentage}}%)</span>
            </div>
            <div class="tag-budget no-border" v-else>&nbsp;</div>
            <div class="tag-delete" v-if="!tag.enabled">
                <md-button class="md-icon-button md-dense show-hovered" @click.stop="remove()" style="margin:0">
                    <md-icon>clear</md-icon>
                </md-button>
            </div>
            <div class="tag-amount" v-if="tag.enabled">
                <amount :amount="tag.amount" :type="type" :currency="currency"></amount>
            </div>
        </div>
        <div class="tag-info edited" v-if="!tag.empty && tag.isEdited">
            <div class="md-layout md-gutter">
                <div class="md-layout-item" style="max-width:80px">
                <md-field>
                        <md-input v-model="tag.bt.name"></md-input>
                </md-field>
                </div>
                <div class="md-layout-item" style="max-width:70px">
                    <md-field>
                        <md-input v-model="tag.bt.color"></md-input>
                    </md-field>
                </div>
                <div>
                <md-button class="md-icon-button md-dense" @click="makeRandom()" style="margin:0;position:relative;top:10px;">
                    <md-icon>cached</md-icon>
                </md-button>
                </div>
                <div class="md-layout-item" style="max-width:70px">
                    <md-field>
                        <md-input class="tar" v-model.number="tag.bt.budget"></md-input>
                    </md-field>
                </div>
                <div class="md-layout-item" style="max-width:100px">
                    <md-field>
                        <md-select v-model="tag.bt.budget_type" md-dense>
                            <md-option value="monthly">Мес.</md-option>
                            <md-option value="yearly">Год</md-option>
                        </md-select>
                    </md-field>
                </div>
                <div style="position:relative;top:4px">
                    <md-button class="md-primary md-raised md-dense" @click.stop="save()">ОК</md-button>
                    <md-button class="md-raised md-dense" @click.stop="cancel()">Отмена</md-button>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="less">
.tag-item {
    padding: 0;
    box-sizing: border-box;
    width: 100%;
    height: 48px;
    display: block;
    border-bottom: 1px transparent;

    &.active {
        font-weight: bold;
        background-color: #d0d0d0;
    }

    &.disabled {
        color: #ccc;
    }

    &:hover:not(.active) {
        background-color: #f0f0f0;
    }

    .tag-delete {
        float: right;
        position: relative;
        top: -8px;
    }
}

.change-color-placeholder {
    display: inline-block;
    width: 16px;
    height: 48px;
}

.tag-color {
    width: 16px;
    height: 47px;
    display: inline-block;
}

.tag-info {
    box-sizing: border-box;
    width: 360px;
    display: inline-block;
    height: 48px;
    padding: 15px 16px 16px 10px;

    .edited {
        width: 500px;
        padding: 0;
        margin: 0;
        position: relative;
        top: -21px;
    }
}

.tag-budget {
    float: right;
    text-align: left;
    font-size: 11px;
    width: 140px;
    padding: 2px 2px 0 8px;
    opacity: 0.8;
    box-sizing: border-box;
    border: 1px solid #eee;
    border-radius: 8px;
    position: relative;
    top: -2px;

    &.no-border {
        border: none;
    }

    &.income {
        color: green;
    }

    &.expense {
        color: #E72020;
    }
    
    &.transfer {
        color: #0E64BA;
    }
}

.tag-name {
    float: left;
}

.tag-amount {
    float: right;
    margin-right: 12px;
}
</style>

