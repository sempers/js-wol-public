let vm = new Vue({
    template: `
    <div class="app-layout">
        <wol-navbar :current="'money'"></wol-navbar>
        <wol-spinner :store="store"></wol-spinner>
        <chart-dialog></chart-dialog>
        <transition name="fade">
            <div v-show="!store.loading">
                <div id="money-header">
                    <tx-form></tx-form>
                </div>
                <div id="money-main" v-if="!store.loading">
                    <div id="money-container">
                        <stats-list></stats-list>
                        <accounts-list></accounts-list>
                        <transactions-list></transactions-list>
                        <pinned-tags-list></pinned-tags-list>
                    </div>
                </div>
            </div>
        </transition>
    </div>
    `,

    el: "#vwol-money",

    router: new VueRouter({
        mode: 'hash',
        routes: []
    }),

    data: function () {
        return {
            store: $store
        };
    },

    created() {
        this.store.loading = true;
        LOG('created()', 'checking the auth with firebase');
        fb.auth(async () => {
            LOG('created()', 'REQUESTING THE DATA')
            const response = await axios.get(`${$server.BASE_URL}/api/money`);
            if (response.data) {
                let rawData = response.data;
                this.store.accounts = rawData.accounts.reject(acc => !acc._id).map(x => new Account(x)).sortBy(x => x.getSort());
                this.store.transactions = rawData.transactions.reject(tx => tx.removed).map(x => new Tx(x));
                this.store.baseTags = rawData.baseTags.reject(bt => !bt.name);
                this.initRates(rawData.rates);

                this.initTransactions();
                this.calcAll();
                if (!this.readQueryParams()) {
                    this.moveToday();
                } else {
                    this.moveByQuery();
                }
                this.store.loading = false;
                $bus.$emit('data-loaded');
                LOG('created()', 'DATA LOADED');
                setInterval(this.recalc, 60 * 15 * 1000);
            } else {
                ERROR('created()', "loading /api/money failed");
            }
        }, 'money');
    },

    mounted() {
        $bus.$on('account-selected', this.selectAccount);
        $bus.$on('special-view', this.showSpecialView);
        $bus.$on('tag-selected', this.selectTag);
        $bus.$on('tx-type-selected', this.selectTxType);
        $bus.$on('filter-cleared', this.clearTxFilter);
        $bus.$on('move', this.moveMonth);
        $bus.$on('tx-added', this.addTx);
        $bus.$on('tx-saved', this.saveTx);
        $bus.$on('tx-removed', this.removeTx);
        $bus.$on('tag-saved', this.saveTag);
        $bus.$on('tag-removed', this.removeTag);
        $bus.$on('tag-renamed', this.renameTag);
        $bus.$on('show-chart', this.showChart);
        $bus.$on('month-view-toggled', this.monthViewToggled);
        $bus.$on('account-renamed', this.renameAcc);
        $bus.$on('account-saved', this.saveAcc);
        $bus.$on('save-rates-clicked', this.saveRates);
        $bus.$on('process-rows', this.processRows);
        $bus.$on("logout", this.logout);
    },

    updated() {
        if (this.store.loading) {
            this.store.loading = false;
        }
    },

    methods: {
        error(msg, response, fname) {
            if (fname)
                ERROR(fname, `[ERROR]: ${msg} ${response && response.status ? " status =  " + response.status : ''}`);
            else
                FIX_TIME(`[ERROR]: ${msg} ${response && response.status ? " status =  " + response.status : ''}`);
            toastr.error(`${msg} ${response && response.status ? " status =  " + response.status : ''}`);
        },

        success(msg, fname) {
            if (fname)
                LOG(fname, `[SUCCESS]: ${msg}`);
            else
                FIX_TIME(`[SUCCESS]: ${msg}`);
            toastr.success(msg);
        },

        logout() {
            this.store.loading = true;
            fb.logout('/money');            
        },

        showChart() {
            if (!this.store.chartShown) {
                this.store.chartShown = true;
                $bus.$emit('show-chart-clicked');
            }
        },

        async saveRates() {
            let rates = this.store.rates[0];
            delete rates.date;
            try {
                await axios.post(`${$server.BASE_URL}/api/money/rates`, rates)
                this.success('Rates have been saved', 'saveRates');
            } catch (err) {
                this.error('Error saving rates', err, 'saveRates');
            }
        },

        /**
         * initialize rates
         * @param arrRates
         */
        initRates(arrRates) {
            arrRates.forEach(r => { this.store.rates[r.YM] = r; });
            this.store.lastUpdated = new Date(this.store.rates[0].date);
        },

        /**
         * initializing accounts array
         */
        initAccounts() {
            
        },

        /**
         * initializing pinned tags array
         */
        initBaseTags() {
            
        },

        /**
         * initializing transactions array
         */
        initTransactions() {
            //исправляем id
            let txIds = [];
            this.store.transactions.forEach(tx => {                
                if (!tx.f41_id || txIds[tx.f41_id]) {
                    tx.f41_id = this.store.nextId();
                    this.saveTx(tx);
                } else {
                    txIds[tx.f41_id] = true;
                }            
            });
            let sorted = this.store.transactions.sortBy(tx => tx.date.getTime());
            sorted.forEach(tx => { this.store.order(tx); });
        },

        /**
         * recalculate everything after receiving rate updates
         */
        async recalc() {
            try {
                const response = await axios.get(`${$server.BASE_URL}/api/money/rates`);
                if (response.data) {
                    LOG('recalc', "received new rates");
                    this.initRates(response.data);
                    this.calcAll();
                }
            } catch (err) {
                ERROR("recalc", "error while recalculating new rates")
            }
        },

        /**
         * calculating all account balances
         */
        calcAll() {
            //blank stats
            let $stats = this.store.stats;

            _.extend($stats, {
                totalBalance: 0,
                totalBalanceUSD: 0,
                netWorth: 0,
                personalThings: 0,
                netBalance: 0,
                flatValue: 0,
                mortgage: 0,
                flatInvested: 0,
                flatEquity: 0,
                flatNwRatio: 0,
                flatROI: 0,
                rubRatio: 0,
                currRatio: 0,
                secRatio: 0,
                cryptoRatio: 0,
                stableRatio: 0
            });

            //special accounts
            $stats.personalThings = this.store.sumTxs(tx => tx.src === "ITEMS", "RUB", "special");
            $stats.flatValue = this.store.sumTxs(tx => tx.src === "FLAT", "RUB", "special");
            $stats.mortgage = this.store.sumTxs(tx => tx.src == "MORTGAGE", "RUB", "special");

            //taking total balance
            this.store.normalAccounts().forEach(acc => {
                this.calcAccount(acc);
                if (!acc.hidden) {
                    let balance = this.store.convert(acc.balance, acc.currency, "RUB"); //OK - we count this at NOW moment
                    $stats.totalBalance += balance;
                    switch (acc.category) {
                        case "rouble":
                            $stats.rubRatio += balance;
                            break;
                        case "currency":
                            $stats.currRatio += balance;
                            break;
                        case "securities":
                            $stats.secRatio += balance;
                            break;
                        case "crypto":
                            $stats.cryptoRatio += balance;
                            break;
                        case "stable":
                            $stats.stableRatio += balance;
                            break;
                    }
                }
            });

            //ratios
            $stats.rubRatio /= $stats.totalBalance / 100;
            $stats.currRatio /= $stats.totalBalance / 100;
            $stats.secRatio /= $stats.totalBalance / 100;
            $stats.cryptoRatio /= $stats.totalBalance / 100;
            $stats.stableRatio /= $stats.totalBalance / 100;

            //flat
            const flatTags = ["Mortgage", "Apartment", "Downpayment", "Repayment", "Remodeling", "House"];
            $stats.flatInvested = this.store.sumTxs(tx => flatTags.includes(tx.tag), "RUB", "special");
            $stats.flatEquity = $stats.flatValue + $stats.mortgage;
            $stats.netBalance = $stats.totalBalance + $stats.personalThings + $stats.mortgage;
            $stats.flatROI = (-$stats.flatEquity / $stats.flatInvested - 1) * 100;

            //net worth
            $stats.netWorth = $stats.flatEquity + $stats.personalThings + $stats.totalBalance;
            $stats.flatNwRatio = $stats.flatEquity / $stats.netWorth * 100;

            const self = this;

            //avg entrance
            let calcAvgEntrance = (investCurr, baseCurr, aTag, aAcc, startYear) => {
                if (!this.store.acc(aAcc))
                    return undefined;

                let txs = this.store.filterTxs(tx => tx.type == "transfer" && tx.tag == aTag && (tx.dst == aAcc || tx.src == aAcc) && tx.year >= startYear && tx.active);
                let sumBaseCurr = 0,
                    sumInvestCurr = 0,
                    sumBuy = 0,
                    sumSell = 0;

                for (let tx of txs) {
                    let srcCurrency = this.store.accCurrency(tx.src);
                    if (srcCurrency == baseCurr[0]) { //BUYING
                        sumBaseCurr += tx.amount;
                        sumBuy += tx.amount;
                        sumInvestCurr += tx.dst_amount;
                    } else if (baseCurr.length > 1 && srcCurrency == baseCurr[1]) {
                        const secondaryRateRe = (/\$\(([\d\.]+)\)/gi);
                        var result = secondaryRateRe.exec(tx.desc);
                        if (result) {
                            var secondaryRate = +result[1];
                            sumBaseCurr += tx.amount / secondaryRate;
                            sumBuy += tx.amount / secondaryRate;
                            sumInvestCurr += tx.dst_amount;
                        }
                    } else if (this.store.accCurrency(tx.src) == investCurr) { //SELLING
                        sumBaseCurr -= tx.dst_amount;
                        sumSell += tx.dst_amount;
                        sumInvestCurr -= tx.amount;
                    }
                }
                let avgEntrance = sumBaseCurr / sumInvestCurr;
                let rate = this.store.rate(investCurr, 0) / this.store.rate(baseCurr[0], 0);
                let profit, profitPercentage;
                if (avgEntrance > 0 && sumBaseCurr > 0) {
                    profit = Math.round((rate - avgEntrance) * this.store.acc(aAcc).balance);
                    profitPercentage = profit / sumBaseCurr * 100;
                } else {                
                    avgEntrance = 0.00001;
                    profit = Math.round(sumSell - sumBuy + rate * this.store.acc(aAcc).balance);
                    profitPercentage = 0;
                }
                return {
                    avgEntrance,
                    profit,
                    profitPercentage
                };
            }

            _.extend($stats.rateItems["USDRUB"], calcAvgEntrance("USD", ["RUB"], "Invest_Usd", "SUSD", 2017));
            _.extend($stats.rateItems["EURRUB"], calcAvgEntrance("EUR", ["RUB"], "Invest_Eur", "SEUR", 2017));
            _.extend($stats.rateItems["BTCUSD"], calcAvgEntrance("BTC", ["USD", "RUB"], "Invest_Btc", "BTC", 2019));
            _.extend($stats.rateItems["BNBUSD"], calcAvgEntrance("BNB", ["USD"], "Invest_Bnb", "BNB", 2019));
            _.extend($stats.rateItems["ETHUSD"], calcAvgEntrance("ETH", ["USD"], "Invest_Eth", "ETH", 2020));

            $stats.totalBalanceUSD = this.$options.filters.fmtAmount(this.store.convert($stats.totalBalance, "RUB", "USD"), { places: 0 }); 
            //OK - we count this at the NOW moment
        },


        /**
         * calculating ACCOUNT BALANCE
         * @param acc -- account object
         */
        calcAccount(acc) {
            let txs = this.store.filterTxs(tx => (tx.src === acc.name || tx.dst === acc.name) && this.store.ymd(tx.date) <= this.store.ymd(new Date()) && tx.active);
            acc.balance = acc.startBalance;
            acc.history = [];
            txs.forEach(tx => {
                let ym = this.store.ym(tx.year, tx.month);
                if (tx.type === "income" || tx.type === "expense") {
                    tx.srcBalanceBefore = acc.balance;
                    acc.balance += tx.amount;
                    tx.src_balance = acc.balance;
                }
                if (tx.type === "transfer") {
                    if (tx.src === acc.name) {
                        tx.srcBalanceBefore = acc.balance;
                        acc.balance -= tx.amount;
                        tx.src_balance = acc.balance;
                    } else if (tx.dst === acc.name) {
                        tx.dst_balance_before = acc.balance;
                        acc.balance += tx.dst_amount;
                        tx.dst_balance = acc.balance;
                    }
                }
                if (tx.type === "balance_reset") {
                    tx.srcBalanceBefore = acc.balance;
                    tx.difference = tx.amount - acc.balance;
                    acc.balance = tx.amount;
                    tx.src_balance = acc.balance;
                }
                // заполняем историю балансами на конец месяца
                acc.history[ym] = acc.balance;
            });
        },

        showSpecialView(view) {
            if (view == "FLAT_INVESTED") {
                const flatTags = ["Mortgage", "Apartment", "Downpayment", "Repayment", "Remodeling", "House"];
                let txf = this.store.filterTxs(tx => flatTags.includes(tx.tag));
                let $cur = this.store.cur;
                $cur.begin = this.store.stats.flatInvested;
                $cur.net = 0;
                $cur.delta_pct = 0;
                $cur.tag = null;
                $cur.end = 0;
                $cur.txType = null;
                $cur.tags = [];
                $cur.tx = txf;
                $cur.budget = {
                    spent: 0,
                    max: 0,
                    type: 'monthly',
                    percentage: 0
                };
            }
        },

        monthViewToggled() {
            this.writeQueryParams();            
            this.showMonth();
        },

        /**
         * showMonth() for SPECIAL ACCOUNTS
         */
        showMonthSpecial() {
            let txf = this.store.filterTxs(tx => this.store.cur.account.name === tx.src, 'special');
            let $cur = this.store.cur;
            $cur.begin = this.store.sumTxs(tx => this.store.cur.account.name === tx.src, "RUB", 'special');
            $cur.net = 0;
            $cur.delta_pct = 0;
            $cur.tag = null;
            $cur.end = 0;
            $cur.txType = null;
            $cur.tags = [];
            $cur.tx = txf;
            $cur.budget = {
                spent: 0,
                max: 0,
                type: 'monthly',
                percentage: 0
            };
            LOG('showMonthSpecial', `acc ${this.store.cur.account.name} is shown, balance is ${this.store.cur.begin}`);
        },

        /**
         * calculating and showing a MONTH or a YEAR - main function
         */
        showMonth() {
            this.readQueryParams();

            const $cur = this.store.cur; //synonyms
            const $acc = $cur.account;
            const emptyTag = "<Пусто>";

            if ($acc && $acc.special) {
                this.showMonthSpecial();
                return;
            }

            //1. FILTERING
            //1.1. ACCOUNT FILTER
            let txf = []; //filter stage 1
            txf = $cur.isMonthView ?
                this.store.filterTxs(tx => $acc ? (tx.src === $acc.name || tx.dst === $acc.name) && tx.year === $cur.year && tx.month === $cur.month : tx.year === $cur.year && tx.month === $cur.month) :
                this.store.filterTxs(tx => $acc ? (tx.src === $acc.name || tx.dst === $acc.name) && tx.year === $cur.year : tx.year === $cur.year);

            let txf2 = txf; //filter stage 2
            //1.2. TYPE FILTER
            if ($cur.txType) {
                txf2 = txf2.filter(tx => tx.type === $cur.txType);
            }
            //1.3. TAG FILTER
            if ($cur.tag) {
                txf2 = txf2.filter(tx => tx.tag == $cur.tag || !tx.tag && $cur.tag == emptyTag);
            }

            let tagStats = {};
            let net = 0;

            //Расчет для переводов
            let calcTransferNoAcc = (tx, src, dst) => {
                if (!dst)
                    return 0;
                if (src.category == dst.category && !tx.tag.startsWith("Invest_"))
                    return 0;
                if (src.category == "rouble" && dst.category != "rouble" || src.category == "rouble" && dst.category == "rouble" && tx.tag.startsWith("Invest_"))
                    return -tx.amount;
                if (src.category != "rouble" && dst.category == "rouble" && tx.tag.startsWith("Invest_"))
                    return tx.amount * tx.rate; //this.store.convertTxAmount(tx, "RUB");
                return 0;
            }

            //2. Вычисляем тэги - не отфильтрованное
            txf.forEach(tx => {
                if (tx.type === "balance_reset" || !tx.active)
                    return;
                let src = this.store.acc(tx.src);
                let dst = this.store.acc(tx.dst);
                let amount = $acc ?
                    (tx.type === "income" || tx.type === "expense" ? tx.amount : ($acc.name === src.name ? -tx.amount : tx.dst_amount)) :
                    (tx.type === "income" || tx.type === "expense" ? this.store.convertTxAmount(tx, "RUB") : calcTransferNoAcc(tx, src, dst));

                //fill in tag stats
                if (!tx.tag) {
                    tagStats[emptyTag] = !tagStats[emptyTag] ? amount : tagStats[emptyTag] + amount;
                } else {
                    tagStats[tx.tag] = !tagStats[tx.tag] ? amount : tagStats[tx.tag] + amount;
                }
            });

            //3. CALCULATE viewNet - the same calculation as above only on txf2, therefore in cur.account == null cur.viewNet always equals cur.net
            txf2.forEach(tx => {
                if (tx.type === "balance_reset" || !tx.active)
                    return;
                let src = this.store.acc(tx.src);
                let dst = this.store.acc(tx.dst);
                let amount = $acc ?
                    (tx.type === "income" || tx.type === "expense" ? tx.amount : ($acc.name === src.name ? -tx.amount : tx.dst_amount)) :
                    (tx.type === "income" || tx.type === "expense" ? this.store.convertTxAmount(tx, "RUB") : ($cur.txType == "transfer" ? calcTransferNoAcc(tx, src, dst) : 0));

                net += amount;
            });

            $cur.viewNet = net;

            //4. DETERMINE BEGIN END
            let begin = 0;
            let end = 0;
            let ym = this.store.ym($cur.year, $cur.month); //current YM
            if ($cur.isMonthView) { //-----------------------//monthly mode
                if ($acc) { //account mode
                    if (txf.length > 0) {
                        end = $acc.endBalance(ym);
                        begin = $acc.beginBalance(ym);
                    } else {
                        begin = end = $acc.beginBalance(ym);
                    }
                } else { //total mode
                    this.store.normalAccounts().forEach(acc => {
                        end += this.store.convert(acc.endBalance(ym), acc.currency, "RUB", ym + 1); //OK
                        begin += this.store.convert(acc.beginBalance(ym), acc.currency, "RUB", ym); //OK
                    });
                }
            } else { //----------------------------------------//yearly mode
                let ymEnd = this.store.ym($cur.year, 11);
                let ymBegin = this.store.ym($cur.year, 0);
                if ($acc) { //account mode
                    begin = $acc.beginBalance(ymBegin);
                    end = $acc.endBalance(ymEnd);
                } else { //total mode
                    this.store.normalAccounts().forEach(acc => {
                        end += this.store.convert(acc.endBalance(ymEnd), acc.currency, "RUB", ymEnd + 1); //OK
                        begin += this.store.convert(acc.beginBalance(ymBegin), acc.currency, "RUB", ymBegin); //OK
                    });
                }
            }

            $cur.begin = begin;
            $cur.end = end;
            $cur.delta = end - begin;
            $cur.deltaPercent = $cur.delta / Math.abs(begin) * 100;
            $cur.rateNet = $cur.delta - $cur.viewNet;
            if ($cur.tag && $cur.tag.startsWith("Invest_")) {
                let txfBuy = txf2.filter(tx => tx.trade == "buy" && tx.active);
                let sum = 0, amount = 0;
                txfBuy.forEach(tx => {
                    let rate = (!tx.dst_amount || !tx.amount) ? 1.0 : tx.dst_amount / tx.amount;
                    sum += tx.amount * rate;
                    amount += tx.amount;
                })
                $cur.avgRateBuy = amount / sum;

                let txfSell = txf2.filter(tx => tx.trade == "sell" && tx.active);
                sum = 0; amount = 0;
                txfSell.forEach(tx => {
                    let rate = (!tx.dst_amount || !tx.amount) ? 1.0 : tx.dst_amount / tx.amount;
                    sum += tx.amount * rate;
                    amount += tx.amount;
                });
                $cur.avgRateSell = sum / amount;
            }

            //5. SORT TAGS AND CALCULATE BUDGETS
            let pinnedTags = [];

            $cur.budget = {
                spent: 0,
                max: 0,
                type: 'monthly',
                percentage: 0
            };

            //5.1. Проходимся по тэгам из статистики
            for (let tag in tagStats) {
                let baseTag = this.store.baseTag(tag); //Не найден, только если транзакция реально не тегирована
                let sum = tagStats[tag] || 0;
                let spent = 0;
                let max = 0;
                let percentage = 0;
                let type = (baseTag && baseTag.budget_type) || "monthly";

                //constructing budget
                if (baseTag && baseTag.budget && sum <= 0) {
                    if (type === "monthly") {
                        spent = -sum;
                        max = baseTag.budget;
                        percentage = Math.round(spent / baseTag.budget * 100);
                        $cur.budget.max += baseTag.budget;
                        $cur.budget.spent += Math.round(spent);
                        $cur.budget.percentage = Math.round($cur.budget.spent / $cur.budget.max * 100);
                    } else if (!$acc) { // не выбран аккаунт
                        spent = -Math.round(this.store.sumTxs(tx => tx.year === $cur.year && tx.tag == baseTag.name && (tx.type === "income" || tx.type === "expense") && tx.active, "RUB"));
                        max = baseTag.budget;
                        percentage = Math.round(spent / baseTag.budget * 100);
                    }
                }

                //конструируем pinned_tag
                pinnedTags.push({
                    bt: baseTag || {
                        name: emptyTag,
                        color: '#ffffff',
                        budget: 0,
                        budget_type: 'monthly'
                    },
                    amount: sum,
                    budget: {
                        type,
                        spent,
                        max,
                        percentage
                    },
                    enabled: true,
                    isEdited: false,
                    empty: !baseTag
                });
            }

            //5.2. Добавляем те тэги, которых не было в статистике
            let zeroPinnedTags = [];
            //Если есть в пиннед, но нет в статистике
            this.store.baseTags.forEach(bt => {
                if (!pinnedTags.find(pt => pt.bt.name === bt.name)) {
                    zeroPinnedTags.push({
                        bt: bt,
                        amount: 0,
                        budget: {
                            type: bt.budget_type,
                            spent: 0,
                            max: 0,
                            percentage: 0
                        },
                        enabled: false,
                        isEdited: false,
                        empty: false
                    });
                    if (bt.budget_type === "monthly") {
                        $cur.budget.max += bt.budget;
                        $cur.budget.percentage = Math.round($cur.budget.spent / $cur.budget.max * 100);
                    }
                }
            });
            zeroPinnedTags = zeroPinnedTags.sortBy(tag => tag.bt.name);
            pinnedTags = pinnedTags.sortBy(tag => -Math.abs(tag.amount));
            $cur.tags = pinnedTags.concat(zeroPinnedTags); //соединяем оба списка
            $cur.tx = txf2;

            if ($cur.isMonthView)
                LOG('showMonth', `Month ${$cur.month + 1} year ${$cur.year} shown, delta is ${$cur.delta}, viewNet is ${$cur.viewNet}, account: ${!$acc ? "null" : $acc.name}, txType: ${$cur.txType}, tag: ${$cur.tag}`);
            else
                LOG('showMonth', `Year ${$cur.year} shown, delta is ${$cur.delta}, viewNet is ${$cur.viewNet}, account: ${!$acc ? "null" : $acc.name}, txType: ${$cur.txType}, tag: ${$cur.tag}`);

            this.writeQueryParams();
        },

        readQueryParams() {
            const $cur = this.store.cur;
            const query = this.$router.history.current.query;
            if (!query || !query.year) {
                return false;
            }            
            $cur.year = +query.year;
            if (typeof query.month === "undefined") {
                $cur.isMonthView = false;
                $cur.month = 0;
            } else {
                $cur.month = +query.month - 1;
            }
            if (query.acc && this.store.acc(query.acc) && (!$cur.account || $cur.account.name != query.acc)) {
                $cur.account = this.store.acc(query.acc);
            }
            if (query.tag && this.store.baseTag(query.tag) && $cur.tag != query.tag){
                $cur.tag = query.tag;
            }
            if (query.txType && ["income", "expense", "balance_reset", "transfer"].includes(query.txType))
            {
                $cur.txType = query.txType;
            }
            return true;
        },

        writeQueryParams() {
            const $cur = this.store.cur;
            let query = { year: $cur.year };
            if ($cur.isMonthView)
            {
                query.month = $cur.month + 1;
            } else {
                delete query.month;
            }
            if ($cur.account) {
                query.acc = $cur.account.name;
            }
            if ($cur.tag) {
                query.tag = $cur.tag;
            }
            if ($cur.txType) {
                query.txType = $cur.txType;
            }
            this.$router.replace({query}).catch(err => { if (err.name != "NavigationDuplicated") { console.error(err); }});
        },

        /**
         * select a tag
         * @param tag
         */
        selectTag(tag) {
            if (this.store.cur.tag !== tag) {
                this.store.cur.tag = tag;
                this.writeQueryParams();
                this.showMonth();
            }
        },

        /**
         * select a transaction type
         * @param type
         */
        selectTxType(type) {
            this.store.cur.txType = type;
            this.writeQueryParams();
            this.showMonth();
        },

        /**
         * clear a transaction filter
         */
        clearTxFilter() {
            this.store.cur.txType = null;
            this.store.cur.tag = null;
            this.writeQueryParams();
            this.showMonth();
        },

        /**
         * select an account
         * @param acc
         */
        selectAccount(acc) {
            this.store.cur.account = acc;
            this.writeQueryParams();
            this.showMonth();            
        },

        /**
         * all going wherever is here
         * @param where
         */
        moveMonth(where) {
            switch (where) {
                case 'prev':
                    this.prevMonth();
                    break;
                case 'next':
                    this.nextMonth();
                    break;
                case 'today':
                    this.moveToday();
                    break;
                case 'first':
                    this.moveFirst();
                    break;
            }
        },

        /**
         * go back a month
         */
        prevMonth() {
            const $cur = this.store.cur;
            if ($cur.isMonthView) {
                if ($cur.month === 0) {
                    $cur.month = 11;
                    $cur.year--;
                } else {
                    $cur.month--;
                }
            } else {
                $cur.month = 0;
                $cur.year--;
            }
            let preferredDate = moment(new Date($cur.year, $cur.month, 1));
            preferredDate.add(1, 'month');
            preferredDate.subtract(1, 'day');
            $bus.$emit("preferred-date", preferredDate._d);
            this.writeQueryParams();
            this.showMonth();
        },


        /**
         * go for a next month
         */
        nextMonth() {
            const $cur = this.store.cur;
            if ($cur.isMonthView) {
                if ($cur.month === 11) {
                    $cur.month = 0;
                    $cur.year++;
                } else {
                    $cur.month++;
                }
            } else {
                $cur.month = 0;
                $cur.year++;
            }
            $bus.$emit("preferred-date", new Date($cur.year, $cur.month, 1));
            this.writeQueryParams();
            this.showMonth();
        },

        moveByQuery() {
            $bus.$emit("preferred-date", new Date(this.store.cur.year, this.store.cur.month, 1));
            this.showMonth();
        },

        /**
         * go to the current date
         */
        moveToday() {
            this.store.cur.isMonthView = true;
            const now = new Date();
            this.store.cur.month = now.getMonth();
            this.store.cur.year = now.getFullYear();
            $bus.$emit("preferred-date", new Date(this.store.cur.year, this.store.cur.month, now.getDate()));
            this.writeQueryParams();
            this.showMonth();
        },

        /**
         * go to the earliest date
         */
        moveFirst() {
            this.store.cur.isMonthView = true;
            this.store.cur.month = 0;
            this.store.cur.year = 2010;
            $bus.$emit("preferred-date", new Date(this.store.cur.year, this.store.cur.month, 1));
            this.writeQueryParams();
            this.showMonth();
        },

        /**
         * create a new tag
         * @param name
         * @returns {{hidden: boolean, budget: number, expanded: boolean, color: *, f41_id: string, name: *, created: Date, budget_type: string, chart: boolean}}
         */
        newTag(name) {
            return {
                hidden: false,
                budget: 0,
                expanded: false,
                color: this.store.randomTagColor(),
                f41_id: "0",
                name: name,
                created: (new Date()),
                budget_type: "monthly",
                chart: true
            };
        },

        /**
         * validate a transaction
         * @param tx
         * @returns {boolean|string|string|*|null|number}
         */
        validateTx(tx) {
            tx.amount = !isNaN(this.store.parseAmount(tx.amount)) ? this.store.parseAmount(tx.amount) : tx.amount;
            tx.dst_amount = !isNaN(this.store.parseAmount(tx.dst_amount)) ? this.store.parseAmount(tx.dst_amount) : tx.dst_amount;

            let ok = (((tx.type === "income" || tx.type === "expense") && tx.amount && !isNaN(tx.amount) && tx.src && tx.date) ||
                ((tx.type === "transfer" && tx.amount && !isNaN(tx.amount) && tx.src && tx.dst && tx.rate && tx.dst_amount && !isNaN(tx.dst_amount) && tx.date)) ||
                (tx.type === "balance_reset" && !isNaN(tx.amount) && tx.src && tx.date));

            if (this.store.isAccSpecial()) {
                ok = !isNaN(tx.amount) && tx.amount != 0 && tx.src && tx.date;
            }

            return ok;
        },

        /**
         * prepare a transaction just before saving
         * @param tx
         */
        prepareTx(tx) {
            if (tx.f41_id === -1 || !tx.f41_id) {
                tx.f41_id = this.store.nextId();
            }
            
            if (tx.type === "expense" && tx.amount > 0) {
                if (tx.new) {
                    tx.amount = -tx.amount;
                } else {
                    tx.type = "income";
                }
            } else if (tx.type == "income" && tx.amount < 0) {
                tx.type = "expense";
            }

            if (tx.type !== "transfer") {
                tx.dst = null;
            }

            if (!tx.date) {
                tx.date = new Date();
            } else if (typeof tx.date == "string") {
                tx.date = new Date(tx.date);
            }

            tx.date.setHours(3);
            tx.date.setMinutes(0);
            tx.date.setSeconds(0);
            tx.date.setMilliseconds(+tx.f41_id * 1000);
            if (!tx.order || Math.floor(tx.order / 100) * 100 != this.store.ymd(tx.date)) {
                this.store.order(tx);
            }

            if (!tx.created) {
                tx.created = new Date();
                tx.new = false;
            }
            
            tx.edited = new Date();
            tx.year = tx.date.getFullYear();
            tx.month = tx.date.getMonth();
            tx.tag = tx.tag.trim();

            //проверка на новый тэг
            if (tx.tag && !this.store.baseTag(tx.tag)) {
                let nTag = this.newTag(tx.tag);
                this.addTag(nTag);
            }

            tx.setTrade();

            if (this.store.accCurrency(tx.src) != "RUB" && tx.type != "transfer") {
                tx.rate = this.store.rate(this.store.accCurrency(tx.src), 0);
            }
        },

        async processRows(rows) {
            let miniTxs = [];
    
            let upsert = function(tag, row, isDistinct) {
                let amount = +(row["Сумма платежа"].replace(",", "."));
                let date = moment(row["Дата операции"], "DD.MM.YYYY")._d;
                let desc = row["Описание"];
                if (!isDistinct) {
                    let rec = miniTxs.find(x => x.tag == tag);
                    if (!rec) {
                        rec = {tag, amount: 0.0, date, desc};
                        miniTxs.push(rec);
                        rec = miniTxs.find(x => x.tag == tag);
                    }
                    rec.amount += amount;
                    if (date.getTime() > rec.date.getTime()) {
                        rec.date = date;
                        rec.desc = desc;
                    }
                } else {
                    miniTxs.push({tag, amount: amount, date, desc});
                }                
            }

            
            for (let row of rows) {
                let cat = row["Категория"];
                let desc = row["Описание"];
                let isLera = $server.NAME == "lera";
                let rule = csvRules.find(x => x.cat.includes(cat) &&
                     (!x.desc || x.desc && x.desc.includes(desc)) &&
                     (isLera && !x.sasha || !isLera && !x.lera));
                if (rule) {
                    upsert(rule.tag, row, rule.distinct);
                } else {
                    upsert(cat, row, true);
                }
            }
    
            for (let value of miniTxs) {
                var tx = new Tx({
                    type: "income",
                    amount: value.amount,
                    dst_amount: null,
                    src: this.store.cur.account?.name || "MAIN",
                    date: value.date,
                    rate: 1,
                    tag: value.tag,
                    tags: [],
                    desc: value.desc || "",
                    removed: false,
                    active: false,
                    isRemoved: false,
                    isEdited: false,
                    created: new Date()
                });

                this.prepareTx(tx);

                try {
                    const response = await axios.post(`${$server.BASE_URL}/api/money/tx`, tx);
                    tx._id = response.data._id;
                    this.store.transactions.push(tx);
                    this.calcAll();
                    this.showMonth();                  
                } catch (err) {
                    this.error(`Error while adding new tx id = ${tx.f41_id}`, err, 'processRows');
                }                
            }            
            this.success("All transactions from CSV file were successfully added");            
        },

        /**
         * save a modified transaction
         * @param tx
         */
        async saveTx(tx) {
            if (!this.validateTx(tx)) {
                toastr.warning("Please correct errors");
                return;
            }

            this.prepareTx(tx);
            let tx_clone = _.clone(tx, true);
            delete tx_clone.__v;

            try {
                await axios.put(`${$server.BASE_URL}/api/money/tx`, tx_clone);
                this.$set(tx, 'isEdited', false);
                this.calcAll();
                this.showMonth();
                this.success(`tx id = ${tx.f41_id} updated in DB`, "saveTx");
            } catch (err) {
                this.error(`Error while saving tx ${tx.f41_id}`, response, "saveTx");
            }
        },

        /**
         * add a new transaction
         * @param tx
         */
        async addTx(ntx) {
            if (!this.validateTx(ntx)) {
                toastr.warning("Please correct errors");
                return;
            }
            ntx.new = true;
            this.prepareTx(ntx);

            try {
                const response = await axios.post(`${$server.BASE_URL}/api/money/tx`, ntx);
                ntx._id = response.data._id;
                this.store.transactions.push(ntx);
                this.calcAll();
                this.showMonth();
                $bus.$emit("tx-saved-ok");
                this.success(`new tx id = ${ntx.f41_id} added to DB`, 'addTx');
            } catch (err) {
                this.error(`Error while adding new tx id = ${ntx.f41_id}`, err, 'addTx');
            }
        },

        /**
         * remove a transaction
         * @param tx
         */
        async removeTx(tx) {
            try {
                await axios.delete(`${$server.BASE_URL}/api/money/tx/${tx._id}`);
                this.store.transactions = this.store.transactions.reject(_tx => _tx._id == tx._id);
                this.calcAll();
                this.showMonth();
                $bus.$emit("tx-removed-ok");
                this.success(`tx id = ${tx.f41_id} removed`, 'removeTx');
            } catch (err) {
                this.error(`Error while removing tx id = ${tx.f41_id}`, err, 'removeTx');
            }
        },

        /**
         * add new pinned tag
         * @param pt
         */
        async addTag(bt) {
            try {
                const response = await axios.post(`${$server.BASE_URL}/api/money/tags`, bt);
                bt._id = response.data._id;
                this.store.baseTags.push(bt);
                this.success(`Successfully saved tag ${bt.name}`, 'addTag');
            } catch (err) {
                this.error(`Error while saving tag ${bt.name}`, err, 'addTag');
            }
        },

        /**
         * save (modified) base tag
         * @param bt
         */
        async saveTag(bt) {
            if (!bt.name) {
                toastr.warning("Empty tag not allowed");
                return;
            }
            try {
                await axios.put(`${$server.BASE_URL}/api/money/tags`, bt);
                this.calcAll();
                this.showMonth();
                let tag = this.store.cur.tags.find(x => x.name === bt.name);
                if (tag) {
                    this.$set(tag, 'isEdited', false);
                }
                this.success(`Successfully saved base tag ${bt.name}`, 'saveTag');
            } catch (err) {
                this.error(`Error while saving base tag ${bt.name}`, err, 'saveTag');
            }
        },

        async removeTag(bt) {
            try {
                await axios.delete(`${$server.BASE_URL}/api/money/tags/${bt._id}`);
                this.store.baseTags = this.store.baseTags.reject(_bt => _bt.name == bt.name);
                this.calcAll();
                this.showMonth();
                this.success(`tag ${bt.name} was removed successfully`, 'removeTag');
            } catch (err) {
                this.error(`Error while removing tag ${bt.name}`, err, 'removeTag')
            }
        },

        async renameTag(opt) {
            try {
                await axios.post(`${$server.BASE_URL}/api/money/tags/rename`, opt);
                this.store.transactions.forEach(tx => {
                    if (tx.tag == opt.oldName) {
                        tx.tag = opt.newName;
                    }
                });
                this.calcAll();
                this.showMonth();
                this.success(`Base tag ${opt.oldName} successfully renamed to ${opt.newName}`, 'renameTag');
            } catch (err) {
                this.error(`Error while renaming base tag ${opt.oldName}`, err, "renameTag");
            }
        },

        /**
         * renaming an account
         * @param {*} opt 
         */
        async renameAcc(opt) {
            try {
                await axios.post(`${$server.BASE_URL}/api/money/accounts/rename`, opt);
                this.store.transactions.forEach(tx => {
                    if (tx.src == opt.oldName) {
                        tx.src = opt.newName;
                    }
                    if (tx.dst = opt.oldName) {
                        tx.dst = opt.newName;
                    }
                });
                this.calcAll();
                this.showMonth();
                this.success(`Account ${opt.oldName} successfully renamed to ${opt.newName}`, 'renameAcc');
            } catch (err) {
                this.error(`Error while renaming txs account from ${opt.oldName} to ${opt.newName}`, err, 'renameAcc');
            }
        },

        /**
         * saving an account
         * @param {*} acc 
         */
        async saveAcc(acc) {
            try {
                await axios.put(`${$server.BASE_URL}/api/money/accounts`, acc)
                this.success(`Account ${acc.name} was saved`, 'saveAcc');
            } catch (err) {
                this.error(`Error while saving account ${acc.name}`, err, 'saveAcc');
            };
        }
    }
});