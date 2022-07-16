//BALANCE
Vue.component("balance", {
    template: `
    <div class="balance-container">
        <div class="currency-code" v-if="currency">{{currency}}</div>
        <div class="account-balance">
            <div class="amount" :class='{"income": amount >= 0 && (currency != "%"), "expense": amount < 0 && (currency !="%")}'>
                <span>{{amount | fmtAmount(options)}}</span>
            </div>
        </div>
        <div class="secondary-amount" v-if="secondary  && amount !== 0">{{secondary_amount | fmtAmount({places: 0})}}&nbsp;&nbsp;{{secondary}}</div>
    </div>`,
    
    props: ["amount", "currency", "category", "secondary"],

    data() {
        return {
            store: $store
        }
    },

    computed: {
        options() {
            switch (this.category) {
                case "crypto":
                    return {
                        places: 4
                    };
                case "2d":
                    return {
                        places: 2
                    };
                case "1d":
                    return {
                        places: 1
                    };
                case "rouble":
                    return {
                        places: 0
                    };
                case "currency":
                    return {
                        places: 0
                    };
                default:
                    return {
                        places: 0
                    };
            }
        },

        secondary_amount() {
            return this.store.convert(this.amount, this.currency, this.secondary); //OK
        },

        btc_amount() {
            return this.store.convert(this.amount, this.currency, "BTC");
        }
    },

    created() {
        this.currency = this.currency || "RUB";
        this.category = this.category || "rouble";
    }
});

//AMOUNT
Vue.component("amount", {
    template: `<div class="amount" :class='{"income": amount > 0 && (!type || type=="income"), "expense": amount < 0 && (!type || type=="expense"), "transfer": (type=="transfer" || type=="transfer-fix"), "balance_reset": type == "balance_reset"}'>{{amount | fmtAmount(c_options)}}</div>`,
    
    props: ["amount", "type", "category", "options"],
    
    computed: {
        c_options() {
            let options = this.options || {};
            if (!this.category)
                return options;
            else {
                switch (this.category) {
                    case "crypto":
                        return Object.assign({
                            places: 4,
                            type: "crypto"
                        }, options);
                    case "2d":
                        return Object.assign({
                            places: 2
                        }, options);
                    case "1d":
                        return Object.assign({
                            places: 1
                        }, options);
                    default:
                        return Object.assign({
                            places: 0
                        }, options);
                }
            }
        }
    }
});

Vue.component("cat-icon", {
    template: `<div class="cat-icon" :class="category"><span><i :class="categoryClass"></i></span></div>`,
    
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
                case "stable":
                    return ["fa", "fa-dollar-sign"];
                case "flat":
                    return ["fa", "fa-home"];
                case "mortgage":
                    return ["fa", "fa-hand-holding-usd"];
                case "items":
                    return ["fa", "fa-car"];
                default:
                    return "";
            }
        }
    }
});

// ACCOUNTS

Vue.component("account-item", {
    template: `
    <div class="acc-item" @click.ctrl.prevent="toggle()" @click.right.prevent="edit()" @click="select()" :class="{'active': store.cur.account && store.cur.account.name == account.name, 'hidden':account.hidden}" >
        <cat-icon :category="account.category" :currency="account.currency"></cat-icon>
        <div class="account-name" v-show="!edited">{{account.name}}</div>
        <md-field style="width:70px;" v-show="edited">
            <md-input v-model.lazy="account.name" @keydown="onKeyDown($event)" ></md-input>
        </md-field>
        <md-field style="width:25px;" v-show="edited">
            <md-input v-model.number.lazy="account.sort" @keydown="onKeyDown($event)"></md-input>
        </md-field>
        <md-checkbox class="hide-checkbox" v-model="account.hidden" v-show="edited">Hide</md-checkbox>
        <balance v-show="!edited" :amount="account.balance" :currency="account.currency" :category="account.category" v-if="account.currency == 'RUB'"></balance>
        <balance v-show="!edited" :amount="account.balance" :currency="account.currency" :category="account.category" :secondary="'RUB'" v-else></balance>
    </div>
    `,

    props: ["account"],

    data() {
        return {
            store: $store,
            edited: false,
            oldName: "",
            oldHidden: false
        };
    },

    methods: {
        edit() {
            if (this.edited) {
                this.edited = false;
                this.account.name = this.oldName;
            } else {
                this.edited = true;
                this.oldName = this.account.name;
                this.oldHidden = this.account.hidden;
            }
        },

        onKeyDown(event) {
            if (event.key == "Enter" && !event.altKey && !event.shiftKey && !event.ctrlKey) {
                event.preventDefault();
                this.save();
            }
        },

        save() {
            $bus.$emit("account-saved", this.account);
            if (this.oldName != this.account.name) {
                this.edited = false;
                $bus.$emit("account-renamed", {
                    oldName: this.oldName,
                    newName: this.account.name
                });
            }
            this.edited = false;
        },

        toggle() {
            $bus.$emit("account-toggled", this.account);
        },

        select() {
            if (this.store.cur.account && this.store.cur.account.name == this.account.name)
                return;
            $bus.$emit("account-selected", this.account);
        }
    }
});

Vue.component("accounts-list", {
    template: `
    <div id="left-col">
        <div class="item">
            <md-button class="md-icon-button md-dense" @click="showChart()" style="margin:0;position:relative;top:-8px;">
                <md-icon>show_chart</md-icon>
            </md-button>
            <md-button class="md-icon-button md-dense" @click="clickFile()" style="margin:0;position:relative;top:-8px;">
                <md-icon>receipt</md-icon>
            </md-button>
            <input type="file" id="csv_file" @change="onFileChange()" style="display:none" />
        </div>
        <div class="accounts-list">
            <div class="acc-item" :class="{'active': store.cur.account === null}" style="font-weight:bold" @click="selectAll()">
                <div class="account-name">Баланс</div>
                <balance style="font-size:16px" :amount="store.stats.totalBalance" :currency="'RUB'" :secondary="'USD'" :category="'rouble'"></balance>
            </div>
            <account-item v-for="account in accounts" :account="account" :key="account.id"></account-item>
        </div>
    </div>
    `,

    data() {
        return {
            store: $store,
            file: null
        };
    },

    computed: {
        accounts() {
            return _.sortBy(_.filter(this.store.accounts, acc => !acc.special && acc._id),
                acc => {
                    let sort = +acc.sort;
                    if (acc.hidden)
                        sort *= 1000;
                    return sort;
                });
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
            let files = document.getElementById("csv_file")?.files;
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
});


//TRANSACTIONS-ITEM
Vue.component("tx-item", {
    template: `
    <div class="tx-item" @click="edit()" :class='{"non-active": !tx.active, "income": tx.type == "income", "expense": tx.type == "expense", "transfer": tx.type=="transfer", "balance_reset": tx.type == "balance_reset"}'>
        <div class="viewed" v-show="!tx.isEdited" @click="edit()">
            <div class="tx-amount">
                <div class="tx-id">{{tx.f41_id}}</div>
                <amount :amount="amount" :type="tx.type" :category="category"></amount>
            </div>
            <div class="tx-tags-text" v-if="tx.type != 'balance_reset' && tx.tag" :style="{'background-color': tagColor}">{{tx.tag}}</div>
            <div class="tx-tags-text-blank" v-if="!(tx.type != 'balance_reset' && tx.tag)"></div>
            <div class="tx-name" v-if="tx.desc">{{tx.desc}}</div>
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
                <!--<div class="tx-balance-detail" v-if="!store.isAccSpecial">{{tx.src}}: {{tx.srcBalanceBefore.toFixed(0)}} &#8594; {{tx.src_balance.toFixed(0)}}</div>
                <div class="tx-balance-detail" v-if="!store.isAccSpecial && tx.dst">{{tx.dst}}: {{tx.dstBalanceBefore.toFixed(0)}} &#8594; {{tx.dst_balance.toFixed(0)}}</div>-->
                <div class="tx-balance-detail" style="padding-left:16px">order: {{tx.order}}</div>
                <div class="tx-balance-detail" style="padding-top:14px"><input type="checkbox" v-model="tx.active" style="padding-top:12px"/><span> Active?</span></div>
                <div class="tx-balance-detail" style="padding-left:32px"><span>Created: {{tx.created | fmtDate}}&nbsp;&nbsp;&nbsp;Edited: {{tx.edited | fmtDate}}</span></div>
                <md-button class="md-raised md-primary md-dense" @click.stop="save()">ОК</md-button>
                <md-button class="md-raised md-dense" @click.stop="cancel()">Отмена</md-button>
            </div>
        </div>
    </div>
    `,

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
});


Vue.component("transactions-list", {
    template: `
    <div id="middle-col">
        <div class="txlist-header">
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
                <div style="width:80px">
                    <amount :amount="store.cur.begin" :category="category" :options="{bug: 1}"></amount>
                    <md-tooltip>На начало месяца</md-tooltip>
                </div>
                <div>
                    <md-icon>looks_two</md-icon>
                </div>
                <div style="width:80px">
                    <amount :amount="store.cur.end" :category="category" :options="{bug: 1}"></amount>
                    <md-tooltip>На конец месяца</md-tooltip>
                </div>
                <div>
                    <md-icon>change_history</md-icon>
                </div>
                <div style="width:120px">
                    <amount :amount="store.cur.delta" :category="category" :options="{bug: 1}"></amount>
                    <md-tooltip>Абсолютный прирост периода (относительный прирост в %)</md-tooltip>
                    <amount class="delta-pct" v-if="!isNaN(store.cur.deltaPercent)" :amount="store.cur.deltaPercent" :options="{delta: 1, places: 1, prefix: '(', suffix:'%)', max_n: 10000}"></amount>
                </div>
                <div v-if="true || store.cur.txType || store.cur.tag">
                    <md-icon>functions</md-icon>
                </div>
                <div style="width:120px" v-if="true || store.cur.txType || store.cur.tag">
                    <amount :amount="store.cur.viewNet" :type="store.cur.txType == 'transfer' ? 'transfer': ''" :category="category" :options="{bug: 1}"></amount>
                    <md-tooltip>Нетто по показанным транзакциям (курсовая разница)</md-tooltip>
                    <amount :amount="store.cur.rateNet" v-if="!store.cur.account && store.cur.rateNet && !(store.cur.txType || store.cur.tag)" :type="'transfer-fix'" class="delta-pct" :options="{delta: 1, prefix:'(', suffix: ')', places:0, t: 'rate'}"></amount>
                </div>
            </template>
            <template v-else>
                <div style="width:50px">Баланс:</div>
                <div style="width:100px">
                    <amount :amount="store.cur.begin" :type="''" :category="''"></amount>
                </div>
            </template>
        </div>
        <div class="txlist-list" :style="{'min-height': minHeight}">
            <div class="no-transactions" v-if="!store.cur.tx.length">Транзакции отсутствуют</div>
            <tx-item v-else v-for="tx in transactions" :tx="tx" :key="tx.f41_id"></tx-item>
        </div>
        <div class="txlist-below" >
            <div v-show="store.cur.tag && store.cur.avgRateBuy">
                <md-icon>compare_arrows</md-icon>
                Покупка: <amount :amount="store.cur.avgRateBuy" :type="''" :options="{places: 2}"></amount>
                Продажа: <amount :amount="store.cur.avgRateSell" :type="''" :options="{places: 2}"></amount>
            </div>
        </div>
    </div>    
    `,

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
            return Math.max((this.store.cur.tx.length) * 51, 15 * 51);
        },

        curMonthText() {
            return this.store.cur.year === (new Date()).getFullYear() ? this.store.MONTHS[this.store.cur.month] : `${this.store.MONTHS[this.store.cur.month]} ${this.store.cur.year}`;
        },

        transactions() {
            return this.store.cur.tx.sortBy(tx => -tx.order);
        }
    },

    methods: {
        move(where) {
            $bus.$emit("move", where);
        },

        toggleView() {
            this.store.cur.isMonthView = !this.store.cur.isMonthView;
            $bus.$emit("month-view-toggled");
        },
    }
});

Vue.component("stats-list", {
    template: `
    <div id="stats-col">
        <div class="item stats-net-worth">
            <div class="account-name">NET WORTH</div>
            <balance :amount="store.stats.netWorth" :currency="'RUB'" :secondary="'USD'" :category="'rouble'"></balance>
        </div>

        <md-divider></md-divider>

        <div class="item stats-items" :class="{'active': store.cur.account && store.cur.account.name == 'ITEMS'}" @click="selectSpecialAccount('ITEMS')">
            <cat-icon :category="'items'"></cat-icon>
            <div class="account-name">Имущество</div>
            <balance :amount="store.stats.personalThings" :currency="'RUB'" :category="'rouble'"></balance>
        </div>

        <div class="item stats-flat" :class="{'active': store.cur.account && store.cur.account.name == 'FLAT'}" @click="selectSpecialAccount('FLAT')">
            <cat-icon :category="'flat'"></cat-icon>
            <div class="account-name">Квартира</div>
            <balance :amount="store.stats.flatValue" :currency="'RUB'" :category="'rouble'"></balance>
        </div>
        <div class="item stats-mortgage" :class="{'active': store.cur.account && store.cur.account.name == 'MORTGAGE'}" @click="selectSpecialAccount('MORTGAGE')">
            <cat-icon :category="'mortgage'"></cat-icon>
            <div class="account-name">Ипотека</div>
            <balance :amount="store.stats.mortgage" :currency="'RUB'" :category="'rouble'"></balance>
        </div>

        <md-divider></md-divider>

        <div class="item " >
            <div class="account-name">Инвестировано</div>
            <balance :amount="store.stats.flatInvested" :currency="'RUB'" :category="'rouble'" ></balance>
        </div>
        <div class="item ">
            <div class="account-name">Эквити квартиры</div>
            <balance :amount="store.stats.flatEquity" :currency="'RUB'" :category="'rouble'"></balance>
        </div>
        <div class="item">
            <div class="account-name">Доля квартиры в NW</div>
            <balance :amount="store.stats.flatNwRatio" :currency="'%'" :category="'1d'"></balance>
        </div>
        <div class="item">
            <div class="account-name">ROI квартиры</div>
            <balance :amount="store.stats.flatROI" :currency="'%'" :category="'1d'"></balance>
        </div>

        <md-divider></md-divider>

        <div class="item stats-ratio">
            <cat-icon :category="'rouble'"></cat-icon>
            <div class="account-name">Рубли</div>
            <balance :amount="store.stats.rubRatio" :currency="'%'" :category="'1d'"></balance>
        </div>
        <div class="item stats-ratio">
            <cat-icon :category="'currency'"></cat-icon>
            <div class="account-name">Валюта</div>
            <balance :amount="store.stats.currRatio" :currency="'%'" :category="'1d'"></balance>
        </div>
        <div class="item stats-ratio">
            <cat-icon :category="'securities'"></cat-icon>
            <div class="account-name">Ценные бумаги</div>
            <balance :amount="store.stats.secRatio" :currency="'%'" :category="'1d'"></balance>
        </div>
        <div class="item stats-ratio">
            <cat-icon :category="'crypto'"></cat-icon>
            <div class="account-name">Криптовалюта</div>
            <balance :amount="store.stats.cryptoRatio" :currency="'%'" :category="'1d'"></balance>
        </div>
        <div class="item stats-ratio">
            <cat-icon :category="'stable'"></cat-icon>
            <div class="account-name">Стейблкоины</div>
        <balance :amount="store.stats.stableRatio" :currency="'%'" :category="'1d'"></balance>
        </div>
        <md-divider></md-divider>

        <rate-item :item="store.stats.rateItems['USDRUB']"></rate-item>
        <rate-item :item="store.stats.rateItems['EURRUB']"></rate-item>

        <md-divider></md-divider>
        <div class="item stats-rates last-updated">
            <div class="ib pl">Обновлено:</div>
            <div class="ib pr">{{lastUpdatedTime}}</div>
        </div>
        <div class="item stats-rates" style="padding:0;display:flex;justify-content:center" v-show="isFirstDayOfMonth()" >
            <md-button class="md-raised md-dense" @click="saveRates()">
                Сохранить курсы
            </md-button>
        </div>
    </div>
    `,

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
});

Vue.component("tx-form", {
    template: `
<div class="tx-form">
    <div class="md-layout md-gutter" style="margin-left:480px">
    <div class="md-layout-item" style="max-width:96px">
        <md-field md-dense>
            <label>Тип</label>
            <md-select name="type" v-model="ntx.type" md-dense>
                <md-option value="income">Доход</md-option>
                <md-option value="expense" v-show="!store.isAccSpecial()">Расход</md-option>
                <md-option value="transfer" v-show="!store.isAccSpecial()">Перевод</md-option>
                <md-option value="balance_reset" v-show="!store.isAccSpecial()">Сброс</md-option>
            </md-select>
        </md-field>
    </div>
    <div class="md-layout-item" style="max-width:60px">
        <md-field class="mb0">
            <label>Сумма</label>
            <md-input class="tar" v-model="ntx.amount"/>
        </md-field>
        <md-field class="mb0" v-if="ntx.type == 'transfer'">
            <label>Сумма2</label>
            <md-input class="tar" v-model="ntx.dst_amount"/>
        </md-field>
    </div>
    <div class="md-layout-item" style="max-width:130px">
        <md-autocomplete class="mb0" name="tags" v-model="ntx.tag" :md-options="tags" md-dense>
            <label>Тэг</label>
        </md-autocomplete>
        <div class="tx-rate" v-if="ntx.type=='transfer'">
            <md-chip>{{rate.toFixed(3)}} / {{(1/rate).toFixed(3)}}</md-chip>
        </div>
    </div>
    <div class="md-layout-item" style="max-width:180px">
        <md-field>
            <label>Описание</label>
            <md-input name="desc" v-model="ntx.desc"/>
        </md-field>
    </div>
    <div class="md-layout-item" style="max-width:130px;margin-left:20px">
        <md-autocomplete class="mb0" name="src" v-model="ntx.src" :md-options="accounts" md-dense>
            <label v-if="ntx.type != 'transfer'">Счет</label>
            <label v-else>Откуда</label>
        </md-autocomplete>
        <md-autocomplete  style="margin-top:0" name="dst" v-model="ntx.dst" v-if="ntx.type=='transfer'" :md-options="accounts" md-dense>
            <label>Куда</label>
        </md-autocomplete>
        <md-button class="md-icon-button md-dense" v-if="ntx.type=='transfer'" @click="swapFromTo()" style="margin:0;position:relative;top:-75px;left:-35px;">
            <md-icon>repeat</md-icon>
        </md-button>
    </div>
    <div class="md-layout-item">
        <md-datepicker name="date" v-model="ntx.date" md-immediately></md-datepicker>
    </div>
    </div>
    <div style="float:right;position:relative;top:8px;">
        <md-button class="md-primary md-dense md-raised" @click="save()">Добавить</md-button>
        <md-button class="md-dense templ-btn" @click="templ(['MAIN','cred'])">MAIN-cred</md-button>
        <md-button class="md-dense templ-btn" @click="templ(['MAIN','SUSD'], 'Invest_Usd')">MAIN-SUSD</md-button>
        <md-button class="md-dense templ-btn" @click="templ(['MAIN','USDT'], 'Invest_Crypto')">MAIN-USDT</md-button>
        <md-button class="md-dense templ-btn" @click="templ(['USDT','BTC'], 'Invest_Btc')">USDT-BTC</md-button>
        <md-button class="md-dense templ-btn" @click="templ(['USDT','BNB'], 'Invest_Bnb')">USDT-BNB</md-button>
    </div>
</div>
    `,

    data() {
        return {
            ntx: new Tx({
                type: "income",
                amount: "",
                dst_amount: "",
                src: "MAIN",
                dst: null,
                created: null,
                edited: null,
                date: new Date(),
                rate: 1,
                tag: "",
                tags: [],
                desc: "",
                f41_id: -1,
                removed: false,
                active: false,
                isRemoved: false,
                isEdited: false,
                active: true
            }),            
            store: $store
        };
    },

    computed: {
        rate() {
            let n = this.ntx;
            return (!n.dst_amount || !n.amount) ? 1.0 : n.dst_amount / n.amount;
        },

        tags() {
            return this.store.baseTags.map(x => x.name).sortBy();
        },

        accounts() {
            return this.store.accounts.filter(a => !a.special && !a.hidden).map(x => x.name);
        }
    },

    created() {
        this.$material.locale.firstDayOfAWeek = 1;
    },

    mounted() {
        $bus.$on("tx-saved-ok", this.blank);
        $bus.$on("account-selected", this.modAcc);
        $bus.$on("tag-selected", this.modTag);
        $bus.$on("preferred-date", this.modDate);
        this.$watch("ntx.dst", this.watchDst);
        this.$watch("ntx.amount", this.watchAmount);
    },

    methods: {
        blank() {
            this.ntx = new Tx({
                type: this.ntx.type,
                amount: 0,
                dst_amount: 0,
                src: this.ntx.src || "MAIN",
                dst: this.ntx.type == "transfer" ? this.ntx.dst : null,
                created: null,
                edited: null,
                date: this.ntx.date,
                rate: 1,
                tag: this.ntx.tag || "",
                tags: [],
                desc: "",
                f41_id: this.store.nextId(),
                removed: false,
                isRemoved: false,
                isEdited: false,
                active: true
            });
        },

        watchDst(value) {
            let n = this.ntx;
            let $s = this.store;
            if (n.type === "transfer" && n.amount && $s.acc(n.src) && $s.acc(value)) {
                if ($s.accCurrency(value) === $s.accCurrency(n.src)) {
                    n.dst_amount = n.amount;
                } else if (!n.dst_amount) {
                    n.dst_amount = this.store.convert(n.amount, $s.accCurrency(n.src), $s.accCurrency(value)); //OK
                }
            }
        },

        watchAmount(value) {
            let n = this.ntx;
            let $s = this.store;
            if (n.type === "transfer" && n.src && n.dst && $s.acc(n.src) && $s.acc(n.dst) && $s.accCurrency(n.dst) === $s.accCurrency(n.src)) {
                this.ntx.dst_amount = value;
            }
        },

        swapFromTo() {
            let swap = this.ntx.src;
            this.ntx.src = this.ntx.dst;
            this.ntx.dst = swap;
        },

        modTag(tag) {
            if (tag && this.ntx.tag !== tag) {
                this.ntx.tag = tag;
            }
        },

        modDate(date) {
            if (date) {
                this.ntx.date = date;
            }
        },

        modAcc(acc) {
            this.ntx.src = acc ? acc.name : "MAIN";
        },

        save() {
            $bus.$emit("tx-added", this.ntx);
        },

        templ(accs, tag) {
            this.ntx.type = "transfer";
            if (this.ntx.src == accs[0] && this.ntx.dst == accs[1]) {
                this.ntx.src = accs[1];
                this.ntx.dst = accs[0];
            } else {
                this.ntx.src = accs[0];
                this.ntx.dst = accs[1];
            }
            if (tag) {
                this.ntx.tag = tag;
            }
        }
    }
});

//PINNED TAGS

Vue.component("pinned-tag-item", {
    template: `
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
                <amount :amount="tag.amount" :type="type" :category="category"></amount>
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
    `,

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

        color() {
            return this.store.tagColor(this.tag.bt.name);
        },

        type() {
            return this.store.noAcc() && this.tag.bt.name.includes("Invest") ? "transfer": "";
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
});

Vue.component("pinned-tags-list", {
    template: `
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
            <pinned-tag-item v-for="tag in store.cur.tags" :tag="tag" :key="tag.name"></pinned-tag-item>
        </div>
    </div>    
    `,
    data() {
        return {
            store: $store
        };
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
});

Vue.component("rate-item", {
    template: `
    <div class="item stats-rates">
        <div class="account-name">{{item.sym1}}{{item.sym2}}</div>
        <div class="account-balance">
            <amount class="mini" style="margin-right:5px":amount="rateDelta" :category="item.category" :options="{delta: 1}"></amount>
            <amount :amount="rateValue" :category="item.category" :type="'rate'"></amount>            
        </div>
        <div class="rate-profit" v-if="item.avgEntrance">● {{item.avgEntrance | fmtAmount({places:2, no_thousand: 1})}} Δ <span :class="{income: item.profit > 0, loss: item.profit<0}">{{item.profit | fmtAmount({places:1, no_thousand:1, delta: 1})}} <span v-show="item.profitPercentage">({{item.profitPercentage | fmtAmount({places:1,delta:1})}}%)</span></span></div>
        <div class="secondary-amount rate" v-if="rateSecondary">{{rateSecondary | fmtAmount({places: 0})}} RUB</div>
    </div>
    `,

    props: ["item"],

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
    },    
});