<script>
import $store from "../store.js";
import $bus from "../../bus.js";
import RateItem from "./RateItem.vue";
import CatIcon from "./CatIcon.vue"
import Balance from "./Balance.vue"
import Amount from "./Amount.vue";

export default {
    components: { RateItem, Amount, CatIcon, Balance },

    data() {
        return {
            store: $store
        };
    },

    computed: {
        lastUpdatedTime() {
            let lastUpdated = this.store.lastUpdated;
            return (!(lastUpdated instanceof Date)) ? "n/a": moment(lastUpdated).format("DD.MM.YYYY HH:mm:ss");
        }
    },

    methods: {
        selectSpecialView(view) {
            $bus.$emit("special-view", view);
        },

        selectSpecialAccount(acc_name) {
            var acc = this.store.accounts.find(acc => acc.special && acc.name == acc_name);
            if (acc) {
                $bus.$emit("account-selected", acc);
            }
        },

        isFirstDayOfMonth() {
            return (new Date()).getDate() == 1;
        },

        saveRates() {
            $bus.$emit("save-rates-clicked");
        },
    }
};
</script>
<template>
    <div id="stats-col">
        <div class="item stats-net-worth">
            <div class="account-name">NET WORTH</div>
            <balance :amount="store.stats.netWorth" :type="'balance'" :currency="'RUB'" :secondary="'USD'" ></balance>
        </div>

        <md-divider></md-divider>

        <div class="item stats-items" :class="{'active': store.cur.account && store.cur.account.name == 'ITEMS'}" @click="selectSpecialAccount('ITEMS')">
            <cat-icon :category="'items'"></cat-icon>
            <div class="account-name">Имущество</div>
            <balance :amount="store.stats.personalThings" :type="'balance'" :currency="'RUB'" ></balance>
        </div>

        <div class="item stats-flat" :class="{'active': store.cur.account && store.cur.account.name == 'FLAT'}" @click="selectSpecialAccount('FLAT')">
            <cat-icon :category="'flat'"></cat-icon>
            <div class="account-name">Квартира</div>
            <balance :amount="store.stats.flatValue" :type="'balance'" :currency="'RUB'" ></balance>
        </div>
        <div class="item stats-mortgage" :class="{'active': store.cur.account && store.cur.account.name == 'MORTGAGE'}" @click="selectSpecialAccount('MORTGAGE')">
            <cat-icon :category="'mortgage'"></cat-icon>
            <div class="account-name">Ипотека</div>
            <balance :amount="store.stats.mortgage" :type="'balance'" :currency="'RUB'" ></balance>
        </div>

        <md-divider></md-divider>

        <div class="item " >
            <div class="account-name">Инвестировано</div>
            <balance :amount="store.stats.flatInvested" :type="'delta'" :currency="'RUB'" ></balance>
        </div>
        <div class="item ">
            <div class="account-name">Эквити квартиры</div>
            <balance :amount="store.stats.flatEquity" :type="'balance'" :currency="'RUB'" ></balance>
        </div>
        <div class="item">
            <div class="account-name">Доля квартиры в NW</div>
            <balance :amount="store.stats.flatNwRatio" :type="'balance'" :currency="'%'" ></balance>
        </div>
        <div class="item">
            <div class="account-name">ROI квартиры</div>
            <balance :amount="store.stats.flatROI" :type="'delta'" :currency="'%'" ></balance>
        </div>

        <md-divider></md-divider>

        <div class="item stats-ratio">
            <cat-icon :category="'rouble'"></cat-icon>
            <div class="account-name">Рубли</div>
            <balance :amount="store.stats.rubRatio"  :type="'balance'" :currency="'%'" ></balance>
        </div>
        <div class="item stats-ratio">
            <cat-icon :category="'currency'"></cat-icon>
            <div class="account-name">Валюта</div>
            <balance :amount="store.stats.currRatio"  :type="'balance'" :currency="'%'" ></balance>
        </div>
        <div class="item stats-ratio">
            <cat-icon :category="'securities'"></cat-icon>
            <div class="account-name">Ценные бумаги</div>
            <balance :amount="store.stats.secRatio"  :type="'balance'" :currency="'%'" ></balance>
        </div>
        <div class="item stats-ratio">
            <cat-icon :category="'crypto'"></cat-icon>
            <div class="account-name">Криптовалюта</div>
            <balance :amount="store.stats.cryptoRatio" :type="'balance'" :currency="'%'"></balance>
        </div>
        <div class="item stats-ratio">
            <cat-icon :category="'stable'"></cat-icon>
            <div class="account-name">Стейблкоины</div>
        <balance :amount="store.stats.stableRatio"  :type="'balance'" :currency="'%'" ></balance>
        </div>
        <md-divider></md-divider>

        <rate-item :item="store.stats.rateItems['USDRUB']" :sym1="'USD'" :sym2="'RUB'" :acc="'SUSD'" :tag="'Invest_Usd'" :year="2017"></rate-item>
        <rate-item :item="store.stats.rateItems['EURRUB']" :sym1="'EUR'" :sym2="'RUB'" :acc="'SEUR'" :tag="'Invest_Eur'" :year="2017"></rate-item>

        <div class="item stats-rates last-updated">
            <div class="ib pl">Обновлено: {{lastUpdatedTime}}</div>
        </div>
        <div class="item stats-rates" style="padding:0;display:flex;justify-content:center" v-show="isFirstDayOfMonth()" >
            <md-button class="md-raised md-dense" @click="saveRates()">
                Сохранить курсы
            </md-button>
        </div>
    </div>
</template>

<style lang="less">
#stats-col {
    float: left;
    width: 260px;
    border: 1px dashed lightgray;
    background-color: #e0e0e0;
    margin-right: 20px;
}

.stats-net-worth {
    height: 58px;

    .account-name {
        font-weight: bold;
        font-size: 16px;
    }

    .account-balance .amount {
        color: rgb(48, 121, 237);
        font-weight: bold;
        font-size: 16px;
    }
}

.stats-rates {
    background-color: #f0f0f0;
    font-size: 15px;
    font-weight: bold;
}

.stats-flat:hover {
    color: darkorange;
}

.stats-mortgage:hover {
    color: crimson;
}

.stats-items:hover {
    color: seagreen;
}

.last-updated {
    font-weight: normal;
    font-size: 13px;
}
</style>

