<script>
import $store from "../store.js";
import $bus from "../../bus.js";
import Amount from "./Amount.vue";

export default {
    components: { Amount },

    props: ["tx"],

    data() {
        return {
            store: $store,
            old: null
        };
    },

    computed: {
        rate() {
            let n = this.tx;
            return !n.dst_amount || !n.amount ? 1.0 : n.dst_amount / n.amount
        },
        
        tags() {
            return this.store.baseTags.map(x => x.name).sortBy();
        },

        accounts() {
            return this.store.normalAccounts().map(x => x.name);
        },

        amount() {
            if (this.store.noAcc()) { //когда не выбран аккаунт
                if (this.tx.type === "transfer") {
                    if (this.store.accCurrency(this.tx.src) === "RUB") {
                        return this.tx.amount;
                    } else if (this.store.accCurrency(this.tx.dst) === "RUB") {
                        return this.tx.dst_amount;
                    }
                }
                return this.store.convertTxAmount(this.tx, "RUB"); //OK
            }
            if (this.store.isAccCurrent(this.tx.src)) {
                return this.tx.amount;
            }
            if (this.store.isAccCurrent(this.tx.dst)) {
                return this.tx.dst_amount;
            } 
        },

        currency() {
            return this.store.accCurrency(this.tx.src);
        }, 

        secondaryAmount() {
            if (this.tx.type === "transfer") {
                if (this.store.accCurrency(this.tx.src) === "RUB") {
                    return this.tx.dst_amount;
                } else if (this.store.accCurrency(this.tx.dst) === "RUB") {
                    return this.tx.amount;
                }
            } 
            return this.store.convertTxAmount(this.tx, this.currency);            
        },

        balance() {
            if (this.store.noAcc()) { //когда не выбран аккаунт
                return "";
            }
            if (this.store.isAccCurrent(this.tx.src)) { //если текущий аккаунт - исходный
                return this.tx.src_balance;
            }
            if (this.store.isAccCurrent(this.tx.dst)) {
                return this.tx.dst_balance;
            }
        },

        category() {
            if (this.store.cur.account === null) { //когда не выбран аккаунт
                return "";
            }
            if (this.store.isAccCurrent(this.tx.src)) {
                return this.store.accCategory(this.tx.src);
            }
            if (this.store.isAccCurrent(this.tx.dst)) {
                return this.store.accCategory(this.tx.dst);
            }
        },

        showDate() {
            return moment(this.tx.date).format("ddd DD");
        },

        specialDate() {
            return moment(this.tx.date).format("DD.MM.YYYY");
        },

        tagColor() {
            return this.store.tagColor(this.tx.tag);
        }
    },

    methods: {
        edit() {
            this.tx.isEdited = true;
            this.old = {
                type: this.tx.type,
                amount: this.tx.amount,
                dst_amount: this.tx.dst_amount,
                src: this.tx.src,
                tag: this.tx.tag,
                dst: this.tx.dst,
                desc: this.tx.desc,
                date: this.tx.date,
                rate: this.tx.rate
            }
        },

        save() {
            this.tx.rate = this.rate;
            this.tx.isEdited = false;
            $bus.$emit("tx-saved", this.tx);
        },

        cancel() {
            if (this.old) {
                this.tx.type = this.old.type;
                this.tx.amount = this.old.amount;
                this.tx.dst_amount = this.old.dst_amount;
                this.tx.src = this.old.src;
                this.tx.dst = this.old.dst;
                this.tx.taq = this.old.tag;
                this.tx.desc = this.old.desc;
                this.tx.date = this.old.date;
                this.tx.rate = this.old.rate;
                this.old = null;
            }
            this.tx.isEdited = false;
        },

        tryRemove() {
            if (this.tx.active) {
                this.tx.isRemoved = true;
            } else {
                this.remove();
            }
        },

        remove() {
            $bus.$emit("tx-removed", this.tx);
        }, 

        selectAcc(acc) {
            if (acc && this.store.acc(acc)) {
                $bus.$emit("account-selected", this.store.acc(acc));
            }            
        }
    }
};
</script>

<template>
    <div class="tx-item" @click="edit()" :class='{"non-active": !tx.active, "income": tx.type == "income", "expense": tx.type == "expense", "transfer": tx.type=="transfer", "balance_reset": tx.type == "balance_reset"}'>
        <div class="viewed" v-show="!tx.isEdited" @click="edit()">
            <div class="tx-amount">
                <div class="tx-id">{{tx.f41_id}}</div>
                <amount :amount="amount" :type="tx.type" :category="category"></amount>
                <!--<div class="secondary-amount" v-if="store.noAcc() && currency != 'RUB'">
                    <amount :type="'sec_balance'" :amount="secondaryAmount" :currency="currency" :show="true"></amount>
                </div>-->
            </div>
            <div class="tx-tags-text" v-if="tx.type != 'balance_reset' && tx.tag" :style="{'background-color': tagColor}">{{tx.tag}}</div>
            <div class="tx-tags-text-blank" v-if="!(tx.type != 'balance_reset' && tx.tag)"></div>
            <div class="tx-desc" v-if="tx.desc">{{tx.desc}}</div>
            <div class="tx-difference" v-if="store.cur.account && tx.type=='balance_reset'">
                <amount :amount="tx.difference" :category="category" :type="'balance_reset'"></amount>
            </div>
            <div class="tx-delete">
                <md-button class="md-icon-button md-dense show-hovered" @click.stop="tryRemove()" style="margin:0">
                    <md-icon>clear</md-icon>
                </md-button>
            </div>
            <div class="tx-date" v-if="!store.isAccSpecial() && store.cur.isMonthView">{{showDate}}</div>
            <div class="tx-date" v-else>{{specialDate}}</div>
            <div class="tx-balance" v-if="store.cur.account && !store.isAccSpecial()">
                <amount class="account-balance" :amount="balance" :category="category"></amount>
            </div>
            <div class="tx-account" @click.stop="selectAcc(tx.dst)" v-if="!store.cur.account && tx.dst">{{tx.dst}}</div>
            <div class="tx-account" @click.stop="selectAcc(tx.src)" v-if="!store.cur.account" :class="{'tar': tx.dst}">{{tx.src}} <div v-if="tx.dst" style="text-decoration:none;float:right">&#8594;</div></div>
            <div class="tx-account" @click.stop="selectAcc(tx.dst)" v-if="store.cur.account && tx.type=='transfer' && tx.src == store.cur.account.name">&#8594; {{tx.dst}}</div>
            <div class="tx-account" @click.stop="selectAcc(tx.src)" v-if="store.cur.account && tx.type=='transfer' && tx.dst == store.cur.account.name">&#8592; {{tx.src}}</div>
            <div class="tx-trade-icon" v-if="tx.trade" :class="tx.trade">{{tx.trade}}</div>
        </div>
        <div v-if="tx.isRemoved" class="btn-item">
            <div class="btn-item-title">Удалить транзакцию?</div>
            <md-button class="md-raised md-accent md-dense" @click.stop="remove()">Да</md-button>
            <md-button class="md-raised md-dense" @click.stop="tx.isRemoved = false">Нет</md-button>
        </div>
        <div v-if="tx.isEdited" class="edited-tx">
            <div style="width:100%">
                <div class="md-layout md-gutter">
                    <div class="md-layout-item" style="max-width:110px">
                        <md-field class="mb0">
                            <md-input class="tar" v-model="tx.amount" v-on:keyup.13.stop="save()"/>
                        </md-field>
                        <md-field class="mb0" v-if="tx.type == 'transfer'">
                            <md-input class="tar" v-model="tx.dst_amount" v-on:keyup.13.stop="save()"/>
                        </md-field>
                    </div>
                    <div class="md-layout-item" style="max-width:130px">
                        <md-autocomplete class="mb0" name="tags" v-model="tx.tag" :md-options="tags" md-dense></md-autocomplete>
                        <div class="tx-rate" v-if="tx.type=='transfer'">
                            <md-chip>{{rate.toFixed(3)}} / {{(1/rate).toFixed(3)}}</md-chip>
                        </div>
                    </div>
                    <div class="md-layout-item">
                        <md-field>
                            <md-input name="desc" v-model="tx.desc" v-on:keyup.13.stop="save()"/>
                        </md-field>
                    </div>
                    <div class="md-layout-item" style="max-width:130px">
                        <md-autocomplete class="mb0" name="src" v-model="tx.src" :md-options="accounts" md-dense></md-autocomplete>
                        <md-autocomplete name="dst" v-model="tx.dst" v-if="tx.type=='transfer'" :md-options="accounts" md-dense></md-autocomplete>
                    </div>
                    <div class="md-layout-item">
                        <md-datepicker name="date" v-model="tx.date" md-dense md-immediately></md-datepicker>
                    </div>
                </div>
            </div>
            <div class="btn-item">
                <div class="tx-balance-detail" style="padding-left:16px">order: {{tx.order}}</div>
                <div class="tx-balance-detail" style="padding-top:14px"><input type="checkbox" v-model="tx.active" style="padding-top:12px"/><span> Active?</span></div>
                <div class="tx-balance-detail" style="padding-left:32px"><span>Created: {{tx.created | fmtDate}}&nbsp;&nbsp;&nbsp;Edited: {{tx.edited | fmtDate}}</span></div>
                <md-button class="md-raised md-primary md-dense" @click.stop="save()">ОК</md-button>
                <md-button class="md-raised md-dense" @click.stop="cancel()">Отмена</md-button>
            </div>
        </div>
    </div>
</template>

<style lang="less">
.tx-item {
    width: 100%;
    border-bottom: 1px solid #eee;
    display: block;
    padding: 0;
    cursor: pointer;
    box-sizing: border-box;

    .viewed {
        width: 100%;
        height: 47px;

        &:hover {
            background-color: #f0f0f0
        }

        &>div {
            display: inline-block;
            /*padding: 15px 16px 16px 16px;*/
            padding: 16px;
            height: 47px;
            margin: 0;
            box-sizing: border-box;
        }
    }

    &.non-active {
        opacity: 0.5;
    }

    .secondary-amount {
        font-size: 10px !important;
        left: 12px;
    }
}

.tx-item:hover .show-hovered,
.tag-item:hover .show-hovered {
    display: inline-block;
}

.tx-amount {
    width: 118px;
    text-align: right;
    padding-right: 8px;
    float: left;
}

.tx-item.expense .tx-amount {
    background-color: #fff8f8;
}

.tx-item.expense.small .tx-amount {
    background-color: #fff8f8;
}

.tx-item.expense.medium .tx-amount {
    background-color: #fff0f0;
}

.tx-item.expense.large .tx-amount {
    background-color: #ffe8e8;
}

.tx-item.income .tx-amount {
    background-color: #f0fff0;
}

.tx-item.balance_reset .tx-amount {
    background-color: #f0f0f0;
}

.tx-item.transfer .tx-amount {
    background-color: #f0f0ff;
}

.tx-item {
    .tx-id {
        font-size: 8px;
        font-style: italic;
        float: left;
    }

    .tx-tags-text {
        position: relative;
        float: left;
    }

    .tx-tags-text-blank {
        width: 60px;
        display: inline !important;
        float: left;
    }

    .tx-desc {
        font-size: 12px;
        color: #777;
        float: left;
        max-width: 340px;
        overflow: hidden;
        display: flex !important;
        justify-content: center;
        padding: 0 0 0 16px !important;
        flex-direction: column;
    }

    .tx-difference {
        float: left;
    }

    .tx-date {
        float: right;
        text-align: right;
        width: 80px;
    }

    .tx-account {
        float: right;
        text-align: left;
        width: 140px;
        text-decoration: underline;
        text-decoration-color: #aaa;
    
        &:hover {
            color: #3079ed;
        }    
    }

    .tx-balance {
        float: right;
        width: 126px;
        padding-left: 3px;
        padding-right: 10px;
        background-color: transparent !important;
    }

    .tx-delete {
        float: right;
        padding: 8px !important;
        width: 50px;
    }

    .tx-trade-icon {
        background-color: white;
        border-radius: 50px;
        color: white;
        border: 1px solid;
        font-size: 10px;
        height: 25px !important;
        padding: 1px 4px 6px 4px !important;
        margin: 10px !important;
        float: right;
        opacity: 0.8;

        &.buy {
            border-color: green;
            color:green;
        }

        &.sell {
            border-color: red;
            color: red;
        }
    }
}

.tx-rate {
    margin-top: 16px;
    text-align: left;

    .edited-tx & {
        margin-top: 8px;
    }
}

.no-transactions {
    text-align: center;
    color: #aaa;
    font-size: 16px;
    padding: 24px;
    font-weight: 100;
}

.btn-item {
    height: 48px;
    text-align: right;
}

.btn-item-title {
    font-weight: bold;
    padding-top: 12px;
}

.btn-item > div {
    display: inline-block;
    vertical-align: middle;
}


.edited-tx .md-field,
.tag-info.edited .md-field {
    margin-top: -6px;
    margin-bottom: 0;
}

.tar {
    text-align: right;
}

.tx-balance-detail {
    text-align: left;
    float: left;
    padding-top: 16px;
    padding-left: 100px;
    color: #888;
    font-size: 0.9em;
}
</style>
