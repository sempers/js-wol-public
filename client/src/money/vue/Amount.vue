<script>
import $config from '../../config.js'

export default {
    props: ["amount", "type", "sign", "currency", "inf", "show", "parths", "max", "decimals"],
    
    computed: {
        c_class() {
            if (this.type == "sec_balance") {
                return "sec_balance";
            }
            if (this.type == "balance" && this.amount >=0 && this.currency != "%")
            {
                return "income";
            }
            if (this.type == "balance" && this.amount <0 && this.currency != "%")
            {
                return "expense";
            }
            if (this.amount > 0 && (this.type=="income" || this.type=="delta"))
            {
                return "income";
            }  
            if (this.amount < 0 && (this.type=="expense" || this.type=="delta")) {
                return "expense";
            }
            if (this.type == "transfer" || this.type=="transfer-fix") {
                return "transfer";
            }
            else {
                return "balance";
            }
        }, 

        c_amount() {
            let decimals = 0;
            let t_sep = $config.thousand;
            let d_sep = $config.decimal;
            let parenthesize = (s) => this.parths ? "(" + s + ")": s;
            let currensize = (s) => this.currency && this.show ? s + " " + this.currency: s;

            switch (this.currency) {
                case "USD":
                case "RUB":
                case "EUR":
                decimals = 0; break;
                case "ETH":
                case "BNB":
                decimals = 2; break;
                case "BTC":
                decimals = 4; break;
                case "%":
                decimals = 1;
            }
            if (this.type == "rate")
                decimals = 2;
            
            if (this.decimals > 0)
                decimals = this.decimals;

            let doSign = this.sign || this.type=="delta";

            let n = this.amount;
            if (n === "")
                return amount;
            if (isNaN(n))
                return "NaN";     

            if (n % 1 === 0) { //Integer
                decimals = 0;
            }           
            let sign = doSign ? {"1": "+", "-1": "-", "0": ""}[Math.sign(n).toString()] : (n < 0 ? "-": "");

            let value = "";
            if (Math.abs(n) == Infinity) {
                value = sign + "∞"; 
            }
            if (this.max && n > this.max) {
                value = ">" + sign + n.toFixed(decimals);
            }

            let intPart = parseInt(n = Math.abs(n).toFixed(decimals)).toString();
            let fracPart = decimals ? d_sep + Math.abs(n - intPart).toFixed(decimals).slice(2) : "";
            if (fracPart.length > 0) {
                while (fracPart[fracPart.length - 1] == "0" && fracPart != d_sep + "0")
                    fracPart = fracPart.substr(0, fracPart.length - 1);
            }
            let firstThousandSep = intPart.length > 3 ? intPart.length % 3 : 0;
            value = sign + (firstThousandSep ? intPart.substr(0, firstThousandSep) + t_sep : "") + intPart.substr(firstThousandSep).replace(/(\d{3})(?=\d)/g, "$1" + t_sep) + fracPart;
            return parenthesize(currensize(value));
        }
    }
}
</script>

<style lang="less">
.amount {
    display: inline-block;
    &.sec_balance {
        color: darkgray;
    }

    &.income {
        color: green;
    }

    &.expense {
        color: #E72020;
    }

    &.balance {
        color: #222;
    }

    &.transfer {
        color: #0E64BA;
    }

    &.mini {
        font-size: 0.85em;
        font-weight: normal;
    }

    .balance_reset {
        color: #222;
    }
}
</style>
<template>
<div class="amount" :class="c_class">{{c_amount}}</div>
</template>

<style lang="less">
.amount {
    display: inline-block;

    &.income {
        color: green;
    }

    &.expense {
        color: #E72020;
    }

    &.balance {
        color: #222;
    }

    &.transfer {
        color: #0E64BA;
    }

    &.mini {
        font-size: 0.85em;
        font-weight: normal;
    }

    .balance_reset {
        color: #222;
    }
}
</style>
