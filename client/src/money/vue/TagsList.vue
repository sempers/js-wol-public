<script>
import $store from "../store.js";
import $bus from "../../bus.js";
import TagItem from "./TagItem.vue";

export default {
    components: { TagItem },

    data() {
        return {
            store: $store
        }
    },

    methods: {
        selectAll() {
            $bus.$emit("tag-selected", null);
        },

        selectType(type) {
            if (type === null) {
                $bus.$emit("filter-cleared");
            }
            $bus.$emit("tx-type-selected", type);
        }
    }
};
</script>
<template>
    <div id="right-col">
        <div id="right-col-header" class="item" >
            <div id="right-col-header-menu" >
                <md-button class="md-icon-button md-dense" @click="selectType(null)" style="margin:0">
                    <md-icon>filter_list</md-icon>
                    <md-tooltip>Сбросить фильтр</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" :class="{'md-accent': store.cur.txType == 'income'}" @click="selectType('income')" style="margin:0">
                    <md-icon>add_circle</md-icon>
                    <md-tooltip>Доходы</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" :class="{'md-accent': store.cur.txType == 'expense'}" @click="selectType('expense')" style="margin:0">
                    <md-icon>remove_circle</md-icon>
                    <md-tooltip>Расходы</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" :class="{'md-accent': store.cur.txType == 'transfer'}" @click="selectType('transfer')" style="margin:0">
                    <md-icon>send</md-icon>
                    <md-tooltip>Переводы</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" :class="{'md-accent': store.cur.txType == 'balance_reset'}" @click="selectType('balance_reset')" style="margin:0">
                    <md-icon>input</md-icon>
                    <md-tooltip>Сброс баланса</md-tooltip>
                </md-button>
            </div>

            <div id="total-budget" class="tag-budget" v-if="store.noAcc() && store.cur.isMonthView"
                :class="{'income': store.cur.budget.percentage <= 100.0, 'expense': store.cur.budget.percentage > 100}">
                <span>{{store.cur.budget.spent}} / {{store.cur.budget.max}} ({{store.cur.budget.percentage}}%)</span>
                <md-tooltip>Общий месячный бюджет</md-tooltip>
            </div>

        </div>
        <div class="pinned-tags-list">
            <tag-item v-for="tag in store.cur.tags" :tag="tag" :key="tag.name"></tag-item>
        </div>
    </div>
</template>

<style lang="less">
#right-col {
    float: left;
    width: 540px;
}

.tags-list {
    width: 100%;
}

#right-col-header {
    width: 360px;
}

#right-col-header-menu {
    position: relative;
    top: -8px;
    float: left;
}

#total-budget {
    font-size: 12px;
    font-weight: bold;
    left: 20px;
    top: -4px;
}
</style>

