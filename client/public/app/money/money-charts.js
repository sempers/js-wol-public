var $ym = $store.ym;

const MYGREEN = "#6ba583";
const MYRED = "#d75442";
const MYGREY = "#9999aa";

function endDate(year, month) {
    return new Date(year, month, daysInMonth(month, year), 23, 59, 59);
}

function daysInMonth(month, year) {
    return 32 - new Date(year, month, 32).getDate();
}

//CHARTS
Vue.component('chart-dialog', {
    template: `
    <md-dialog id="chartDialog" :md-active.sync="store.chartShown">
    <md-dialog-content>
        <div id="chart-menu">
            <div class="vamdib" >
                <md-button class="md-icon-button md-dense" :class="{'md-accent': selectedChart == 'account'}" @click="selectedChart='account'">
                    <md-icon>bar_chart</md-icon>
                </md-button>
                <md-button class="md-icon-button md-dense" :class="{'md-accent': selectedChart == 'tag'}" @click="selectedChart = 'tag'">
                    <md-icon>insert_chart</md-icon>
                </md-button>
                <md-button class="md-icon-button md-dense" :class="{'md-accent': selectedChart == 'pie'}" @click="selectedChart = 'pie'">
                    <md-icon>pie_chart</md-icon>
                </md-button>
            </div>
            <!-- Год -->
            <div class="vamdib" >
                <select class="chart-select" v-model.number="selectedYear" >
                    <option v-for="y in years">{{y}}</option>
                </select>
            </div>
            <!--Аккаунт-->
            <div class="vamdib" v-show="selectedChart == 'account'">
                <select style="width:140px" class="chart-select" v-model="selectedAccount">
                    <option v-for="acc in accounts" :value="acc">{{acc}}</option>
                </select>
            </div>
            <!--Тэг-->
            <div class="vamdib" v-show="selectedChart == 'tag'">
                <select style="width:140px" class="chart-select" v-model="selectedTag">
                    <option v-for="tag in tags" :value="tag">{{tag}}</option>
                </select>
            </div>
            <!-- Тип -->
            <div class="vamdib" v-show="selectedChart == 'pie'">
                <select style="width:140px" class="chart-select" v-model="selectedType">
                    <option value="income">Доход</option>
                    <option value="expense">Расход</option>
                </select>
            </div>
            <div class="vamdib" style="position:relative;top:2px;">
                <md-button class="md-raised md-default md-dense" @click="setRange('all')">Все время</md-button>
                <md-button class="md-raised md-default md-dense" @click="setRange('from_2014')">2014</md-button>
                <md-button class="md-raised md-default md-dense" @click="setRange('from_2016')">2016</md-button>
                <md-button class="md-raised md-default md-dense" @click="setRange('from_2019')">2019</md-button>
                <md-button class="md-raised md-default md-dense" @click="setRange(2)">2 года</md-button>
                <md-button class="md-raised md-default md-dense" @click="setRange(1)">1 год</md-button>
                <md-button class="md-raised md-default md-dense" @click="setRange('ytd')">YTD</md-button>
                <md-checkbox v-model="includeYtd" style="position:relative;top:-3px">YTD</md-checkbox>
                <md-checkbox v-model="inDollar" style="position:relative;top:-3px">$</md-checkbox>
            </div>
            <div class="vamdib chart-dates">
                <span>{{fromDate | date}}</span> &mdash; <span>{{toDate | date}}</span>
            </div>
        </div>
        <div id="chart"></div>
    </md-dialog-content>
</md-dialog>
    `,

    data: function () {
        return {
            store: $store,
            selectedChart: 'pie',
            selectedType: 'expense',
            selectedYear: (new Date()).getFullYear(),
            selectedAccount: 'ALL',
            selectedTag: 'Food',
            totalLine: 'candlestick',
            includeYtd: true,
            inDollar: false,
            from: {
                month: (new Date()).getMonth(),
                year: (new Date()).getFullYear()
            },
            to: {
                month: (new Date()).getMonth(),
                year: (new Date()).getFullYear()
            },
            txs: []
        }
    },

    computed: {
        tags() {
            return this.store.baseTags.filter(bt => bt && bt.name && !bt.name.includes("Invest")).map(x => x.name).unique().sortBy();
        },

        accounts() {
            return ["ALL", ...this.store.normalAccounts().map(x => x.name)];
        },

        fromDate() {
            return new Date(this.from.year, this.from.month, 1);
        },

        toDate() {
            let nowYear = (new Date()).getFullYear();
            let nowMonth = (new Date()).getMonth();
            return this.to.year === nowYear && this.to.month === nowMonth ?
                new Date(this.to.year, this.to.month, (new Date()).getDate(), 23, 59, 59) :
                endDate(this.to.year, this.to.month);
        },

        years() {
            let years = [];
            for (let i = (new Date()).getFullYear(); i>=2010; i--) {
                years.push(i);
            }
            return years;
        }
    },    

    watch: {
        selectedChart() {
            this.chart();
        },

        selectedType() {
            this.chart();
        },

        selectedAccount() {
            if (this.store.acc(this.selectedAccount) || this.selectedAccount == "ALL") {
                this.chart();
            }
        },

        selectedTag() {
            if (this.store.baseTag(this.selectedTag)) {
                this.chart();
            }
        },

        selectedYear() {
            this.setRange(this.selectedYear);
            this.chart();
        }        
    },

    mounted() {
        LOG('mounted', 'set data-loaded, show-chart-clicked handler');
        const self = this;

        $bus.$on('data-loaded', () => {
            LOG('data-loaded', 'set firstOccurence');
            self.firstOccurence = true;
        });

        $bus.$on('show-chart-clicked', () => {
            LOG('show-chart-clicked', 'draw chart');
            Vue.nextTick(function () {
                if (self.firstOccurence) {
                    self.setRange('ytd');
                    self.firstOccurence = false;
                } else {
                    self.chart();
                }
            });
        });
    },

    methods: {
        /**
         * Abstract chart method
         */
        chart() {
            if (!$("#chart")[0]) {
                ERROR('chart', '#chart does not exist');
                return;
            }
            switch (this.selectedChart) {
                case 'pie':
                    this.pieChart();
                    break;
                case 'tag':
                    this.tagChart();
                    break;
                case 'account':
                    this.accountChart();
                    break;
            }
        },


        /**
         * Set Range and load transactions
         * @param range
         */
        setRange(range) {
            let nowYear = (new Date()).getFullYear();
            let nowMonth = (new Date()).getMonth();

            //range is month
            if (range === 'month') {
                this.from = {
                    month: nowMonth,
                    year: nowYear
                };
                this.to = {
                    month: nowMonth,
                    year: nowYear
                };
            }

            //range is 'all'
            if (range === 'all') {
                this.from = {
                    month: 0,
                    year: 2010
                };
                this.to = {
                    month: nowMonth,
                    year: nowYear
                };
            }

            //range is 'from_year'
            if (isNaN(range) && range.indexOf("from") > -1) {
                this.from = {
                    month: 0,
                    year: +range.split('_')[1]
                };
                if (this.includeYtd) {
                    this.to = {
                        month: nowMonth,
                        year: nowYear
                    };
                } else {
                    this.to = {
                        month: 11,
                        year: nowYear - 1
                    };
                }
            }

            //range is N years back
            if (!isNaN(+range) && +range >= 1 && +range <= 5) {
                this.from = {
                    month: 0,
                    year: nowYear - (+range)
                };
                if (this.includeYtd) {
                    this.to = {
                        month: nowMonth,
                        year: nowYear
                    };
                } else {
                    this.to = {
                        month: 11,
                        year: nowYear - 1
                    };
                }
            }

            //range is Year-to-date
            if (range === 'ytd') {
                this.from = {
                    month: 0,
                    year: nowYear
                };
                this.to = {
                    month: nowMonth,
                    year: nowYear
                };
            }

            //range is year X
            if (!isNaN(+range) && +range > 2000) {
                this.from = {
                    month: 0,
                    year: +range
                };
                this.to = {
                    month: range != nowYear ? 11 : nowMonth,
                    year: +range
                };
            }

            LOG('setRange', `${moment(this.fromDate).format('DD.MM.YYYY')} - ${moment(this.toDate).format('DD.MM.YYYY')}`);
            this.chart();
        },


        /**
         * TAG CHART
         */
        tagChart() {
            if (!this.selectedTag) {
                ERROR('tagChart', 'no tag selected');
                return;
            }
            let dataset = [];
            let date = new Date(this.fromDate); //FIX
            let to = this.toDate;
            let toYM = $ym(to);    //TARGET YM
            let now = new Date();
            let nowYM = $ym(now);
            let curr = this.inDollar ? "USD": "RUB"

            let fromChart = new Date(this.fromDate);
            let endChart = endDate(to.getFullYear(), to.getMonth());

            let lastNonZero = 0;

            //1. DATASET CONSTRUCTING
            while ($ym(date.getFullYear(), date.getMonth()) <= toYM) {
                let month = date.getMonth();
                let year = date.getFullYear();
                let ym = $ym(year, month);
                let amount = this.store.sumTxs(tx => (tx.type == 'income' || tx.type == 'expense') && tx.year == year && tx.month == month && tx.tag == this.selectedTag && tx.active, curr);

                let point = {
                    ym: ym,
                    date: new Date(year, month, 1),
                    amount: Math.abs(amount),
                    income: amount >= 0,
                    pct: 0
                };

                if (dataset.length > 0 && lastNonZero != 0) {
                    point.pct = (point.amount - lastNonZero) / lastNonZero * 100;
                }

                if (amount != 0) {
                    lastNonZero = Math.abs(amount);
                }

                dataset.push(point);

                if (date.getMonth() === 11) {
                    date.setMonth(0);
                    date.setYear(date.getFullYear() + 1);
                } else {
                    date.setMonth(date.getMonth() + 1);
                }
            }

            //2. Stats
            let sum = 0;
            let avgDatasetLength = 0;
            let nonZero = 0;

            dataset.forEach(d => {
                if (d.ym != nowYM) {
                    sum += d.income ? -d.amount : d.amount;
                    avgDatasetLength++;
                    if (d.amount)
                        nonZero++;
                }
            });

            let cSum = sum;
            sum = Math.abs(sum);
            let avgMonthly = avgDatasetLength === 0 ? 0 : sum / avgDatasetLength;
            let avgYearly = avgMonthly * 12;
            let avgNonZero = nonZero === 0 ? 0 : sum / nonZero;

            //3. Clear previous and set sizes
            $("#chart svg").remove();
            const width = $("#chart").innerWidth();
            const height = 720;
            const margin = { top: 20, right: 60, bottom: 60, left: 30 };

            //4. Create chart and its dimensions
            const svg = d3.select("#chart").append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            let barWidth = Math.max((width - (margin.right + margin.left)) / (dataset.length * 2.5), 5);
            let x = d3.time.scale().domain([fromChart, endChart]).range([margin.left, width - margin.right]);
            let y = d3.scale.linear().domain([0, 1.25 * d3.max(dataset, d => d.amount)]).nice().range([height - margin.bottom, margin.top]);

            //4a. создаем див тултипа
            var div = !$(".tooltip")[0] ?
                d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0) :
                d3.select("div.tooltip");

            //5. Data
            svg.append("g")
                .selectAll("rect")
                .data(dataset)
                .enter()
                .append("rect")
                .attr("x", d => x(d.date))
                .attr("y", d => y(d.amount))
                .attr("height", d => y(0) - y(d.amount))
                .attr("width", barWidth)
                .attr("class", "tag-bar")
                .classed("now-bar", d => d.ym == nowYM)
                .attr("fill", d => d.income ? MYGREEN : MYRED)
                .on("mouseenter", (d) => {
                    div.transition()
                        .duration(50)
                        .style("left", (d3.event.pageX + 8) + "px")
                        .style("top", (d3.event.pageY - 8) + "px")
                        .style("opacity", 0.9);
                    div.html(`<span style="font-weight:bold">${moment(d.date).format("MMMM YYYY")}</span><br>
                                <span style="font-weight:bold;color:${d.income ? MYGREEN : MYRED}">${d.amount.toFixed(0)}</span><br>
                                <span style="color:${d.income && d.pct >= 0 || !d.income && d.pct < 0 ? MYGREEN : MYRED}">${d.pct.toFixed(1)}%</span>`);
                })
                .on("mouseleave", () => {
                    div.transition()
                        .duration(50)
                        .style("opacity", 0);
                });

            //6. Axes
            svg.append('g').attr('class', 'x-axis axis');
            svg.append('g').attr('class', 'y-axis axis');

            let xAxis = d3.svg.axis().orient('bottom').scale(x);
            let yAxis = d3.svg.axis().orient('left').scale(y);

            svg.select('.x-axis').attr("transform", `translate(0, ${(height - margin.bottom)})`).call(xAxis);
            svg.select('.y-axis').attr("transform", "translate(" + margin.left + ")").call(yAxis);

            //7. Outputting stats
            let horiLine = d3.svg.line().x(d => d.x).y(d => d.y).interpolate("linear");

            let drawHorizontal = function(value, color) {
                let data = [{ 'x': margin.left, 'y': y(value) }, { 'x': width - margin.right, 'y': y(value) }];
                svg.append("path")
                    .datum(data)
                    .attr("class", "line")
                    .attr("d", horiLine)
                    .style("stroke", color);
            }

            let drawText = function(label, value, offset, color) {
                svg.append('text').attr({
                    transform: `translate(${offset},5)`
                })
                .text(`${label}: ${value.toFixed(0)}`)
                .style({
                    'fill': color,
                    'font-size': '14px',
                    'font-weight': 'bold',
                    'font-family': 'monospace',
                    'color': color
                });
            }

            let initOffset = 250;
            let subinterval = 180;

            drawText('Сумма', cSum, initOffset, 'darkgreen');
            drawText('Ср.мес.', avgMonthly, initOffset+subinterval, 'indigo');
            drawHorizontal(avgMonthly, 'indigo');
            drawText('Ср.год.', avgYearly, initOffset+2*subinterval, 'darkblue');
            drawText('Ср. ненулевое', avgNonZero, initOffset+3*subinterval, 'darkorange');
            drawHorizontal(avgNonZero, 'darkorange');

            if (this.store.baseTag(this.selectedTag).budget) {
                let budget = this.store.baseTag(this.selectedTag).budget;
                if (curr == "USD")
                    budget = this.store.convert(budget, "RUB", "USD");
                let budgetType = this.store.baseTag(this.selectedTag).budget_type;
                drawText("Бюджет " + (budgetType == 'monthly' ? "(мес.)" : "(год.)"), budget, initOffset+4*subinterval, 'blue');
                if (budgetType == 'monthly') {
                    drawHorizontal(budget, 'blue');
                }
            }
        },


        /**
         * ACCOUNT CHART
         */
        accountChart() {
            if (!this.selectedAccount)
                return;

            let dataset = [];
            let date = new Date(this.fromDate);
            let to = this.toDate;
            let now = new Date();
            let nowYM = $ym(now);
            let toYM = $ym(to);
            let fromChart = new Date(this.fromDate);
            let endChart = endDate(to.getFullYear(), to.getMonth());
            let datasetLength = 1;
            

            //1. DATASET CONSTRUCTING
            if (this.selectedAccount !== "ALL") {   //account mode
                let acc = this.store.acc(this.selectedAccount);
                while ($ym(date) <= toYM) {
                    let year = date.getFullYear();
                    let month = date.getMonth();
                    let ym = $ym(year, month);
                    let point = {
                        addDelta: 0,
                        ym: $ym(year, month),
                        date: new Date(year, month, 1),
                        end: endDate(year, month),
                        income: 0,
                        expense: 0,
                        open: acc.beginBalance(ym),
                        close: acc.endBalance(ym)
                    };

                    point.income = this.store.sumTxs(tx => tx.src == this.selectedAccount && tx.type == "income" && tx.year == year && tx.month == month && tx.activ);    //in account currency
                    point.expense = -this.store.sumTxs(tx => tx.src == this.selectedAccount && tx.type == "expense" && tx.year == year && tx.month == month && tx.active); //in account currency
                    point.addDelta = point.close - point.open - point.income + point.expense;

                    dataset.push(point);

                    if (date.getMonth() === 11) {
                        date.setMonth(0);
                        date.setYear(date.getFullYear() + 1);
                    } else {
                        date.setMonth(date.getMonth() + 1);
                    }
                }

                datasetLength = dataset.length;

            } else { //total mode
                let curr = this.inDollar ? "USD": "RUB";
                while ($ym(date) <= $ym(to)) {
                    let open = 0;
                    let close = 0;
                    let month = date.getMonth();
                    let year = date.getFullYear();
                    let ym = $ym(year, month);

                    this.store.normalAccounts().forEach((acc) => {
                        open += this.store.convert(acc.beginBalance(ym), acc.currency, curr, ym); //OK
                        close += this.store.convert(acc.endBalance(ym), acc.currency, curr, ym + 1);
                    });

                    let point = {
                        addDelta: 0,
                        ym,
                        date: new Date(year, month, 1),
                        end: endDate(year, month),
                        income: 0,
                        expense: 0,
                        open,
                        close
                    };

                    point.income = this.store.sumTxs(tx =>  tx.type == "income" && tx.year == year && tx.month == month && tx.active, curr);
                    point.expense = -this.store.sumTxs(tx => tx.type == "expense" && tx.year == year && tx.month == month && tx.active, curr);
                    point.addDelta = point.close - point.open - point.income + point.expense;

                    dataset.push(point);

                    if (date.getMonth() === 11) {
                        date.setMonth(0);
                        date.setYear(date.getFullYear() + 1);
                    } else {
                        date.setMonth(date.getMonth() + 1);
                    }
                }
                datasetLength = dataset.length;
            }

            //1. Очистка предыдущих графиков
            $("#chart svg").remove();

            //2. Размеры
            const width = $("#chart").innerWidth();
            const height = 720;
            const margin = { top: 20, right: 60, bottom: 60, left: 30 };
            const chartWidth = width - (margin.right + margin.left);
            const barWidthFull = Math.round(chartWidth / datasetLength);
            const candleStickPadding = Math.max(Math.round(barWidthFull * 0.15), 2);
            const barWidthCandlestick = barWidthFull - 2 * candleStickPadding;
            const barWidthMiniBars = Math.max(barWidthFull / 4, 3);

            //3. Создаем тело чарта
            const svg = d3.select("#chart").append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //4. Создаем размерности и функции
            let x = d3.time.scale().domain([fromChart, endChart]).range([margin.left, width - margin.right]);
            let y = d3.scale.linear().domain([0, d3.max(dataset, d => d3.max([d.open, d.close]))]).nice().range([height - margin.bottom, margin.top]);

            //5. Создаем линии или японские свечи
            //создаем див тултипа
            var div = !$(".tooltip")[0] ?
                d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0) :
                d3.select("div.tooltip");

            //баланс свечами
            svg.append("g")
                .selectAll("rect")
                .data(dataset)
                .enter()
                .append("rect")
                .attr("x", d => x(d.date))
                .attr("y", d => y(d3.max([d.open, d.close])))
                .attr("height", d => Math.max(y(d3.min([d.open, d.close])) - y(d3.max([d.open, d.close])), 1))
                .attr("transform", `translate(${candleStickPadding},0)`)
                .attr("width", barWidthCandlestick)
                .attr("class", "balance-candle")
                .classed("balance-rise", d => d.close > d.open)
                .classed("balance-fall", d => d.open > d.close)
                .classed("now-candle", d => d.ym == nowYM)
                .on("mouseenter", d => {
                    let firstPadding = 15;
                    let delta = d.close - d.open;
                    let deltaPct = delta / d.open * 100;
                    let strColor = "black";
                    if (delta >= 0) {
                        delta = '+' + delta.toFixed(0);
                        deltaPct = '+' + deltaPct.toFixed(1) + "%";
                        strColor = MYGREEN;
                    }
                    else {
                        delta = delta.toFixed(0);
                        deltaPct = deltaPct.toFixed(1) + "%";
                        strColor = MYRED;
                    }

                    let deltaStr = `${"Дельта:".padEnd(firstPadding, " ")}<span style='color:${strColor}'>${delta.padStart(8, " ")}</span></br>`;
                    let deltaPctStr = `${"В %:".padEnd(firstPadding, " ")}<span style='color:${strColor}'>${deltaPct.padStart(8, " ")}</span><br>`;

                    div.transition()
                        .duration(50)
                        .style("left", (d3.event.pageX + 8) + "px")
                        .style("top", (d3.event.pageY - 8) + "px")
                        .style("opacity", 0.9);

                    let transfersString = this.selectedAccount == "ALL" ? "Курс. разница:" : "Переводы: ";

                    div.html(`<span style="font-weight:bold">${moment(d.date).format("MMMM YYYY")}</span><br>
                          ${"Начало:".padEnd(firstPadding, " ")}${d.open.toFixed(0).padStart(8, " ")}<br>
                          ${"Конец:".padEnd(firstPadding, " ")}${d.close.toFixed(0).padStart(8, " ")}<br>
                          ${deltaStr}
                          ${deltaPctStr}
                          ${"Доход:".padEnd(firstPadding, " ")}<span style='font-weight:bold;color:${MYGREEN}'>${d.income.toFixed(0).padStart(8, " ")}</span><br>
                          ${"Расход:".padEnd(firstPadding, " ")}<span style='font-weight:bold;color:${MYRED}'>${d.expense.toFixed(0).padStart(8, " ")}</span><br>
                          ${transfersString.padEnd(firstPadding, " ")}<span style='color:blue'>${d.addDelta.toFixed(0).padStart(8, " ")}</span><br>
                          ${"USDRUB:".padEnd(firstPadding-4, " ")} ${this.store.rate("USD", d.ym).toFixed(2)}-${this.store.rate("USD", d.ym + 1).toFixed(2)}
                    `);
                })
                .on("mouseleave", () => {
                    div.transition()
                    .duration(50)
                    .style("opacity", 0);
                });

            //Столбики доходов
            svg.append("g")
                .selectAll("rect")
                .data(dataset)
                .enter()
                .append("rect")
                .attr("fill", MYGREEN)
                .attr("class", "delta-bar")
                .attr("x", d => x(d.date))
                .attr("y", d => y(d.income))
                .attr("height", d => y(0) - y(d.income))
                .attr("width", barWidthMiniBars)
                .attr("transform", `translate(${(barWidthFull - (barWidthMiniBars * 3)) / 2},0)`);;

            //Столбики расходов
            svg.append("g")
                .selectAll("rect")
                .data(dataset)
                .enter()
                .append("rect")
                .attr("fill", MYRED)
                .attr("class", "delta-bar")
                .attr("x", d => x(d.date))
                .attr("y", d => y(d.expense))
                .attr("height", d => y(0) - y(d.expense))
                .attr("width", barWidthMiniBars)
                .attr("transform", `translate(${(barWidthFull - (barWidthMiniBars * 3)) / 2 + barWidthMiniBars},0)`);

            //столбики дельт
            svg.append("g")
                .selectAll("rect")
                .data(dataset)
                .enter()
                .append("rect")
                .attr("fill", "blue")
                .attr("class", "delta-bar")
                .attr("x", d => x(d.date))
                .attr("y", d => (d.addDelta >= 0 ? y(d.addDelta) : y(0)))
                .attr("height", d => Math.abs(y(0) - y(d.addDelta)))
                .attr("width", barWidthMiniBars)
                .attr("transform", `translate(${(barWidthFull - (barWidthMiniBars * 3)) / 2 + 2 * barWidthMiniBars},0)`);

            //7. Создаем оси
            svg.append('g').attr('class', 'x-axis axis');
            svg.append('g').attr('class', 'y-axis axis');

            let xAxis = d3.svg.axis().orient('bottom').scale(x);
            let yAxis = d3.svg.axis().orient('left').scale(y).tickFormat(d => parseInt(d / 1000) + "k");

            svg.select('.x-axis')
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(xAxis);

            svg.select('.y-axis')
            .attr("transform", `translate(${margin.left})`)
            .call(yAxis);

            //8.средний доход
            let sumIncome = 0;
            let sumExpense = 0;
            let sumDelta = 0;
            let avgDatasetLength = 0;
            dataset.forEach(d => {
                if (d.ym != nowYM) {
                    sumIncome += d.income;
                    sumExpense += d.expense;
                    sumDelta += d.addDelta;
                    avgDatasetLength++;
                }
            });

            avgDatasetLength = avgDatasetLength || 1;
            let avgIncome = sumIncome / avgDatasetLength;
            let avgExpense = sumExpense / avgDatasetLength;

            let drawText = function(label, value, offset, color) {
                svg.append('text').attr({
                    transform: `translate(${offset},5)`
                })
                .text(`${label}: ${value.toFixed(0)}`)
                .style({
                    'fill': color,
                    'font-size': '14px',
                    'font-weight': 'bold',
                    'font-family': 'sans-serif',
                    'color': color
                });
            }

            let initOffset = 250;
            let interval = 360;
            let subinterval = 180;

            drawText('(+)Сумма', sumIncome, initOffset, 'darkgreen');
            drawText('(+)Ср.мес.', avgIncome, initOffset + subinterval, MYGREEN);
            drawText('(-)Сумма', sumExpense, initOffset + interval, 'darkred');
            drawText('(-)Ср.мес.', avgExpense,initOffset + interval + subinterval, MYRED);
            drawText('(Δ)Сумма.', sumDelta, initOffset + 2*interval, MYGREY)
        },


        /**
         * PIE CHART
         */
        pieChart() {
            let datasetByTags = {};
            let dataset = [];
            let curr = this.inDollar ? "USD": "RUB";
            //DATASET
            let quot = this.selectedType === "income" ? 1 : -1;
            let fd = new Date(this.fromDate);
            let td = new Date(this.toDate);
            let txs = this.store.filterTxs(tx => (tx.type == 'income' || tx.type == 'expense') && tx.date.getTime() >= fd.getTime() && tx.date.getTime() <= td.getTime());
            txs.forEach(tx => {
                let amount = quot * Math.round(this.store.convertTxAmount(tx, curr));
                if (tx.tag) {
                    if (datasetByTags[tx.tag]) {
                        datasetByTags[tx.tag].y += amount;
                    } else {
                        datasetByTags[tx.tag] = {
                            x: tx.tag,
                            y: amount,
                            color: this.store.tagColor(tx.tag)
                        };
                    }
                }
            });

            let sum = 0;
            for (let key in datasetByTags) {
                if (datasetByTags[key].y > 0) {
                    dataset.push(datasetByTags[key]);
                    sum += datasetByTags[key].y;
                }
            }

            dataset.forEach(p => {
                let pct = (p.y / sum * 100).toFixed(1);
                if (pct === "0.0") {
                    pct = (p.y / sum * 100).toFixed(2);
                }
                if (pct === "0.00") {
                    pct = (p.y / sum * 100).toFixed(3);
                }
                p.pct = pct;
            });

            dataset = dataset.sortBy(d => -d.y);

            const pie = d3.layout.pie().value(d => d.y).padAngle(.02);

            $("#chart svg").remove();

            const legendRectSize = 13;
            const legendSpacing = 7;
            const legendHeight = legendRectSize + legendSpacing;

            const el = $("#chart");
            const width = el.innerWidth();
            el.height(Math.max(30 + legendHeight * dataset.length, 720));
            const height = el.innerHeight();

            const outerRadius = width / 4;
            const innerRadius = 100;
            const X_OFFSET = 40;
            const Y_OFFSET = 10;
            let pie_x_offset = width/3 - X_OFFSET;
            const pie_y_offset = (height / 2 - 20) + Y_OFFSET;

            //1. PIE
            const arc = d3.svg.arc().outerRadius(outerRadius).innerRadius(innerRadius);
            const svg = d3.select("#chart")
                .append("svg")
                .attr({
                    width: width,
                    height: height
                })
                .append('g')
                .attr({
                    transform: `translate(${pie_x_offset},${pie_y_offset})`
                });

            const path = svg.selectAll('path')
                .data(pie(dataset))
                .enter()
                .append('path')
                .attr({
                    d: arc,
                    fill: function (d) {
                        return d.data.color;
                    }
                });

            path.transition().duration(1000).attrTween('d', d => function (t) {
                return arc(d3.interpolate({ startAngle: 0, endAngle: 0 }, d)(t));
            });

            let endDrawing = function() {
                svg.selectAll('text')
                .data(pie(dataset))
                .enter()
                .append("text")
                .transition()
                .duration(200)
                .attr("transform", d => `rotate(45)`)
                .attr("transform", d => `translate(${arc.centroid(d)})`)
                .attr("dy", "0.4em")
                .attr("text-anchor", "middle")
                .text(d => d.data.pct >= 1 ? `${d.data.x} ${d.data.pct}%` : '')
                .style({
                    'fill': '#555',
                    'font-size': '12px'
                });
                
                //2. LEGEND
                const legend = svg.selectAll('.legend')
                    .data(pie(dataset))
                    .enter()
                    .append('g')
                    .attr({
                        class: 'legend',
                        transform: function (d, i) {
                            let legend_y_offset = (i % 25 + 1) * legendHeight - width / 4 + Y_OFFSET;
                            let legend_x_offset = width / 3 + 30 - X_OFFSET;                            
                            if (i>= 25)
                                legend_x_offset += 230;
                            return `translate(${legend_x_offset},${legend_y_offset})`;
                        }
                    });

                function _color(d) {
                    return d.data.color;
                }

                legend.append('rect').attr({
                    width: legendRectSize,
                    height: legendRectSize,
                    rx: 12,
                    ry: 12
                })
                .style({
                    fill: _color,
                    stroke: _color
                });

                legend.append('text').attr({
                    x: 22,
                    y: 11
                })
                .text(d => `${d.data.x.toString().padEnd(12, ' ')} ${d.data.y.toString().padStart(8, ' ')} (${d.data.pct}%)`
                )
                .style({
                    fill: '#555555',
                    'font-size': '12px',
                    'font-family': 'monospace'
                });

                svg.append('text').attr({
                    transform: `translate(${width / 3 + 52 - X_OFFSET},${ -width / 4 + Y_OFFSET + 10})`
                })
                .text(`${"Сумма:".padEnd(12, " ")} ${sum.toString().padStart(8, " ")} (100%)`)
                .style({
                    'fill': '#555555',
                    'font-size': '12px',
                    'font-family': 'monospace',
                    'font-weight': 'bold'
                });
            }

            setTimeout(endDrawing, 0);
        }
    },

    filters: $store.filters
});