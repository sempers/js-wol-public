<script>
import $store from '../store.js'
import Amount from './Amount.vue'

export default {
    components: { Amount },

    props: ["item", "sym1", "sym2", "acc", "tag", "year"],

    data() {
        return {
            store: $store
        };
    },
    
    computed: {
        rateValue() {
            return this.store.rate(this.item.sym1, 0) / this.store.rate(this.item.sym2, 0)
        },

        rateDelta() {
            let nowYm = this.store.ym((new Date()).getFullYear(), (new Date()).getMonth());
            return this.rateValue - this.store.rate(this.item.sym1, nowYm) / this.store.rate(this.item.sym2, nowYm);
        },

        rateSecondary() {
            return this.item.sym2 == "RUB" || !this.item.avgEntrance ? null : this.store.rate(this.item.sym1, 0);
        }
    }
}
</script>
<template>
<div class="item stats-rates">
        <div class="account-name">{{item.sym1}}{{item.sym2}}</div>
        <div class="account-balance">
            <amount class="mini" style="margin-right:5px" :type="'delta'" :amount="rateDelta" :sign="true" :decimals="2"></amount>
            <amount :amount="rateValue" :type="'rate'"></amount>
        </div>
        <div class="rate-profit" v-if="item.avgEntrance">{{item.avgEntrance.toFixed(2)}} Δ <span :class="{'income': item.profit > 0, 'expense': item.profit<0}">{{item.profit.toFixedS()}} <span v-show="item.profitPercentage" :class='{"income": item.profitPercentage>0, "expense": item.profitPercentage<0}'>({{item.profitPercentage.toFixedS(1)}}%)</span></span></div>
        <div class="secondary-amount rate" v-if="rateSecondary">{{rateSecondary.toFixed(0)}} RUB</div>
    </div>
</template>
<style lang="less">
.secondary-rate {
    float: right;
    color: darkgray !important;
    font-size: 11px !important;
    padding-right: 13px;
    clear: both;
    position: relative;
    top: -8px;
    left: 10px;
    font-weight: normal !important;
}

.rate-profit {
    float: left;
    position: relative;
    top: -4px;
    color: darkslategray !important;
    font-size: 11px !important;
    clear: both;
    font-weight: normal !important;
}
</style>
