<script>
import $store from '../store.js'
import Amount from './Amount.vue'

export default {
    props: ["amount", "currency", "category", "secondary"],

    components: {Amount},

    data() {
        return {
            store: $store
        }
    },

    computed: {
        secondary_amount() {
            return this.store.convert(this.amount, this.currency, this.secondary); //OK
        },

        btc_amount() {
            return this.store.convert(this.amount, this.currency, "BTC");
        }
    },

    created() {
        
    }
}
</script>
<template>
<div class="balance-container">
    <div class="currency-code" v-if="currency">{{currency}}</div>
    <div class="account-balance">
        <amount :type="'balance'" :amount="amount" :currency="currency"></amount>
    </div>
    <div class="secondary-amount" v-if="secondary && amount!==0">
        <amount :type="'sec_balance'" :amount="secondary_amount" :currency="secondary" :show="true"></amount>
    </div>
</div>
</template>

<style lang="less">
.secondary-amount {
    float: right;
    color: darkgray !important;
    font-size: 11px !important;
    padding-right: 13px;
    clear: both;
    position: relative;
    top: -8px;
    left: 10px;
    font-weight: normal !important;

    &.rate {
        clear:none;
        top:-4px;
        left:5px;
    }
}

.balance-item {
    display:block;
}

.currency-code {
    font-size: 11px;
    font-weight: 100;
    float: right;
    margin-top: 3px;
    position: relative;
    left: -3px;
    top: -2px;
}

.secondary-amount {
    float: right;
    color: darkgray !important;
    font-size: 11px !important;
    padding-right: 13px;
    clear: both;
    position: relative;
    top: -8px;
    left: 10px;
    font-weight: normal !important;

    &.rate {
        clear:none;
        top:-4px;
        left:5px;
    }    
}
</style>