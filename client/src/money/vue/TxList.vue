<script>
import $store from "../store.js";
import $bus from "../../bus.js";
import TxItem from "./TxItem.vue";
import Amount from "./Amount.vue";

export default {
    components: { TxItem, Amount },

    data() {
        return {
            store: $store
        };
    },

    computed: {
        category() {
            return this.store.noAcc() ? "rouble": this.store.accCategory(this.store.cur.account.name)
        },

        minHeight() {
            return Math.max(this.store.cur.tx.length * 51, 15 * 51);
        },

        curMonthText() {
            return this.store.cur.year === (new Date()).getFullYear() ? this.store.MONTHS[this.store.cur.month] : `${this.store.MONTHS[this.store.cur.month]} ${this.store.cur.year}`;
        },

        transactions() {
            return this.store.cur.tx.sortBy(tx => -tx.order);
        },
        currency() {            
            return this.store.noAcc() ? "RUB" : this.store.accCurrency(this.store.cur.account.name);
        }
    },

    methods: {
        move(where) {
            $bus.$emit("move", where);
        },

        toggleView() {
            this.store.cur.isMonthView = !this.store.cur.isMonthView;
            $bus.$emit("month-view-toggled");
        }
    }
};
</script>
<template>
    <div id="middle-col">
        <div id="txlist-header">
            <div style="width:300px">
                <md-button class="md-icon-button md-dense" :class="{'md-accent': !store.cur.isMonthView}" @click="toggleView()" style="margin:0">
                    <md-icon>date_range</md-icon>
                    <md-tooltip>Период месяц/год</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" @click="move('first')" style="margin:0">
                    <md-icon>first_page</md-icon>
                    <md-tooltip>На самое начало</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" @click="move('prev')" style="margin:0">
                    <md-icon>chevron_left</md-icon>
                    <md-tooltip>Предыдущий период</md-tooltip>
                </md-button>
                <div class="txlist-header-month" v-if="store.cur.isMonthView">{{curMonthText}}</div>
                <div class="txlist-header-month" v-else><strong>{{store.cur.year}}</strong></div>
                <md-button class="md-icon-button md-dense" @click="move('next')" style="margin:0">
                    <md-icon>chevron_right</md-icon>
                    <md-tooltip>Следующий период</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" @click="move('today')" style="margin:0">
                    <md-icon>last_page</md-icon>
                    <md-tooltip>Сегодня</md-tooltip>
                </md-button>
            </div>
            <template v-if="!store.isAccSpecial()">
                <div>
                    <md-icon>looks_one</md-icon>
                </div>
                <div style="width:75px">
                    <amount :amount="store.cur.begin" :type="'balance'" :currency="currency"></amount>
                    <md-tooltip>На начало месяца</md-tooltip>
                </div>
                <div>
                    <md-icon>looks_two</md-icon>
                </div>
                <div style="width:75px">
                    <amount :amount="store.cur.end" :type="'balance'" :currency="currency"></amount>
                    <md-tooltip>На конец месяца</md-tooltip>
                </div>
                <div>
                    <md-icon>change_history</md-icon>
                </div>
                <div style="width:120px">
                    <amount :amount="store.cur.delta" :type="'delta'" :currency="currency"></amount>
                    <md-tooltip>Абсолютный прирост периода (относительный прирост в %)</md-tooltip>
                    <amount class="delta-pct" v-if="!isNaN(store.cur.deltaPercent)" :amount="store.cur.deltaPercent" :type="'delta'" :currency="'%'" :show="true" :parths="true" :max="10000"></amount>
                </div>
                <div v-if="true || store.cur.txType || store.cur.tag">
                    <md-icon>functions</md-icon>
                </div>
                <div style="width:125px" v-if="true || store.cur.txType || store.cur.tag">
                    <amount :amount="store.cur.viewNet" :type="store.cur.txType == 'transfer' ? 'transfer': 'delta'" :currency="'RUB'"></amount>
                    <md-tooltip>Нетто по показанным транзакциям (курсовая разница)</md-tooltip>
                    <amount :amount="store.cur.rateNet" v-if="!store.cur.account && store.cur.rateNet && !(store.cur.txType || store.cur.tag)" :type="'transfer-fix'" class="delta-pct" :sign="true" :parths="true"></amount>
                </div>
            </template>
            <template v-else>
                <div style="width:50px">Баланс:</div>
                <div style="width:100px">
                    <amount :amount="store.cur.begin" :type="'balance'" :currency="'RUB'"></amount>
                </div>
            </template>
        </div>
        <div id="txlist-list" :style="{'min-height': minHeight}">
            <div class="no-transactions" v-if="!store.cur.tx.length">Транзакции отсутствуют</div>
            <tx-item v-else v-for="tx in transactions" :tx="tx" :key="tx.f41_id"></tx-item>
        </div>
        <div id="txlist-footer" >
            <div v-show="store.cur.tag && store.cur.avgRateBuy">
                <md-icon>compare_arrows</md-icon>
                Покупка: <amount :amount="store.cur.avgRateBuy" :type="'rate'"></amount>
                Продажа: <amount :amount="store.cur.avgRateSell" :type="'rate'" ></amount>
            </div>
        </div>
    </div>
</template>

<style lang="less">
.no-transactions {
    text-align: center;
    color: #aaa;
    font-size: 16px;
    padding: 24px;
    font-weight: 100;
}

#middle-col {
    float: left;
    width: 848px;
    border-top-style: none;
    background-color: #ffffff;
}

#txlist-header {
    background-color: #fafafa;
    padding: 9px 10px 12px 7px;
    border-bottom: 1px solid #eeeeee;
    height: 48px;
    box-sizing: border-box;
    vertical-align: middle;

    &>div {
        display: inline-block;
        vertical-align: middle;
    }

    .txlist-header-month {
        width: 104px;
        /* padding-left: 10px; */
        display: inline-block;
        /* vertical-align: middle; */
        padding-top: 7px;
        text-align: center;
    }
}

#txlist-list {
    border-left: 1px solid #eee;
    border-right: 1px solid #eee;
}

#txlist-footer {
    height: 40px;
    padding:10px;
    background-color:#f5f5f5;
}

.delta-pct {
    font-size: 0.85em
}
</style>



<style lang="less">
</style>
