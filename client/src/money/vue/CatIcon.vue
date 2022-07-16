<script>
export default {
    props: ["category", "currency"],

    computed: {
        categoryClass() {
            switch (this.currency) {
                case "RUB":
                    return ["fa", "fa-ruble-sign"];
                case "USD":
                    return ["fa", "fa-dollar-sign"];
                case "EUR":
                    return ["fa", "fa-euro-sign"];
                case "BTC":
                    return ["fab", "fa-btc"];
                case "ETH":
                    return ["fab", "fa-ethereum"];
                case "BNB":
                    return ["fab", "fa-bnb"];
            }

            switch (this.category) {
                case "rouble":
                    return ["fa", "fa-ruble-sign"];
                case "currency":
                    return ["fa", "fa-dollar-sign"];
                case "securities":
                    return ["fa", "fa-coins"];
                case "crypto":
                    return ["fab", "fa-btc"];
                case "flat":
                    return ["fa", "fa-home"];
                case "mortgage":
                    return ["fa", "fa-hand-holding-usd"];
                case "stable":
                    return ["fa", "fa-dollar-sign"];
                case "items":
                    return ["fa", "fa-car"];
                default:
                    return "";
            }
        }
    }
}
</script>

<template>
    <div class="cat-icon" :class="category"><span><i :class="categoryClass"></i></span></div>
</template>

<style lang="less">
.cat-icon {
    font-size: 13px;
    font-weight: bold;
    float: left;
    margin-left: -10px;
    border-radius: 10px;
    margin-right: 6px;
    width: 24px;
    color: black !important;
    text-align: center;
    &>div {
        width: 100%;
        height: 100%;
    }
    
    &:hover {
        color: white !important;
    }
    
    &.rouble {
        background-color: lightgray;
    }
    
    &.securities {
        background-color: lightyellow;
    }
    
    &.crypto {
        background-color: #fe9900;
    }

    &.stable {
        background-color: aquamarine;
    }
    
    &.currency {
        background-color: #B5EAFF;
    }
    
    &.flat {
        background-color: darkorange;
    }
    
    &.items {
        background-color: seagreen;
    }
    
    &.mortgage {
        background-color: crimson;
    }
}

.vamdib {
    vertical-align: middle;
    display: inline-block
}

.fa-bnb {
    background-image: url(../assets/currency/bnb.png);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    display: inline-block;
    width: 15px;
    height: 15px;
    position: relative;
    top: 2px;
}
.cat-icon {
    display: inline-block;
    font-size: 13px;
    font-weight: bold;
    float: left;
    margin-left: -10px;
    border-radius: 10px;
    margin-right: 6px;
    width: 24px;
    color: black !important;
    text-align: center;
    &>div {
        width: 100%;
        height: 100%;
    }
    
    &:hover {
        color: white !important;
    }
    
    &.rouble {
        background-color: lightgray;
    }
    
    &.securities {
        background-color: lightyellow;
    }
    
    &.crypto {
        background-color: #fe9900;
    }
    
    &.currency {
        background-color: #B5EAFF;
    }
    
    &.flat {
        background-color: darkorange;
    }
    
    &.items {
        background-color: seagreen;
    }
    
    &.mortgage {
        background-color: crimson;
    }
}
</style>