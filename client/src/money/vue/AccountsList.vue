<script>
import $store from "../store.js";
import AccountItem from "./AccountItem.vue";
import Balance from "./Balance.vue"
import { LOG } from "../../logs.js"
import $bus from "../../bus.js"

export default {
    components: { AccountItem, Balance },

    data() {
        return {
            store: $store,
            file: null
        };
    },

    computed: {
        accounts() {
            return _.sortBy(
                _.filter(this.store.accounts, acc => !acc.special && acc._id),
                acc => {
                    let sort = +acc.sort;
                    if (acc.hidden) sort *= 1000;
                    return sort;
                }
            );
        }
    },

    methods: {
        clickFile() {
            document.getElementById("csv_file").click();
        },

        onFileChange() {            
            const reader = new FileReader();
            reader.addEventListener('load', evt => {
                if (!evt.target.result)
                    return;
                let lines = evt.target.result;
                let rows = [];
                const stream = csv.parseString(lines, { headers:true, delimiter:";"})
                    .on('error', error => console.error(error))
                    .on('data', row => rows.push(row))
                    .on('end', rowCount => {
                        LOG('onFileChange', `Parsed ${rowCount} rows`);
                        $bus.$emit("process-rows", rows);
                    });
            });
            let files = document.getElementById("csv_file").files;
            if (files && files[0]) {
                reader.readAsText(files[0], 'CP1251');
            }
        },

        selectAll() {
            $bus.$emit("account-selected", null);
        },

        showChart() {
            $bus.$emit("show-chart");
        }
    }
};
</script>
<template>
    <div id="left-col">
        <div class="item">
            <md-button class="md-icon-button md-dense top-button" @click="showChart()">
                <md-icon>show_chart</md-icon>
            </md-button>
            <md-button class="md-icon-button md-dense top-button" @click="clickFile()">
                <md-icon>receipt</md-icon>
            </md-button>
            <input type="file" id="csv_file" @change="onFileChange()" style="display:none" />
        </div>
        <div class="accounts-list">
            <div
                class="acc-item"
                :class="{'active': store.cur.account === null}"
                style="font-weight:bold"
                @click="selectAll()"
            >
                <div class="account-name">Баланс</div>
                <balance
                    style="font-size:16px"
                    :amount="store.stats.totalBalance"
                    :currency="'RUB'"
                    :secondary="'USD'"
                    :category="'rouble'"
                ></balance>
            </div>
            <account-item v-for="account in accounts" :account="account" :key="account.id"></account-item>
        </div>
    </div>
</template>

<style lang="less">
#left-col {
    float: left;
    width: 250px;
}

.top-button {
    margin:0;
    position:relative;
    top:-8px;
}

.account-name {
    overflow: hidden;
    word-break: break-all;
    float: left;
}

.account-balance {
    float: right;
    margin-right: 10px;
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
</style>


