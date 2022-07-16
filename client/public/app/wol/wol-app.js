new Vue({
    el: "#vwol",
    template: `
    <div class="app-layout">
    <wol-navbar :current="'wol'"></wol-navbar>
    <wol-spinner :store="store"></wol-spinner>
    <transition name="fade">
    <div v-show="!store.loading">
        <div class="cntnr">
            <header style="padding-top:58px">
                <div>
                    <div class="pl">
                        <strong>Прожито {{store.lived.percentage}}</strong>, недель: <strong>{{store.lived.weeks}}</strong>, дней: <strong>{{store.lived.days}}</strong>, часов: <strong>{{store.lived.hours}}</strong>
                    </div>
                    <div class="pl weeks-infoed">
                        Недель заполнено: <strong>{{c_infoed}} ({{((c_infoed / store.lived.weeks) * 100).toFixed(1) + '%'}})</strong>
                    </div>
                    <div class="pr" style="position:relative;left:-27px">
                        <strong>Осталось {{store.remained.percentage}}</strong>, недель: <strong>{{store.remained.weeks}}</strong>, дней: <strong>{{store.remained.days}}</strong>, часов: <strong>{{store.remained.hours}}</strong>
                    </div>
                </div>
            </header>
            <div style="position:relative">
                <table class="yeartable clearfix">
                    <tr v-for="(year_weeks, year, index) in store.years">
                        <td class="yeartd year-header" valign="middle">{{year}}<span class="uninfoed" v-if="countUninfoed(year_weeks)">({{countUninfoed(year_weeks)}})</span></td>
                        <td class="yeartd year-weeks" valign="middle">
                            <div class="week-placeholder" v-if="index === 0" :style="'width:' + store.firstYearPlaceHolderWidth + 'px'"></div>
                            <week-item v-for="week in year_weeks" :key="week.weekNum" :week="week" v-on:week-clicked="editWeek(week)" v-on:week-created="createWeek(week)"></week-item>
                        </td>
                    </tr>
                </table>
                <div class="tag-bar">
                    <div class="tag-bar-item" v-for="ti in c_tags">
                        <div :class="'wi-outer wi-inner ' + ti.tag.replace('#','')" v-if="getTagIcons().includes(ti.tag)"></div>
                        <a href="" @click.prevent="setTagged(ti)" class="tag-link" :class="{'strong': ti.weekNums.length>20, 'tag-selected': ti.tag == store.curTag}">{{ti.tag}}<small>&nbsp;</small>({{ti.weekNums.length}})&nbsp;&nbsp;&nbsp; </a>
                    </div>
                    <md-field>
                        <label>Поиск</label>
                        <md-input type="text" v-model="store.searchedWord" style="width:300px" />
                    </md-field>
                    <div style="text-align:center">
                        <md-button type="button" @click="searchWord()">Искать в описаниях</md-button>
                    </div>
                </div>                        
            </div>
        </div>
        </div>
    </transition>
    <edit-dialog></edit-dialog>
    <map-dialog></map-dialog>
    <div id="editMarkerForm" v-show="isEdited" style="zoom-index:1000;position:absolute;">
        <md-field>
            <md-input class="tar" v-model="editedTitle"/>
        <md-field>
	</div>
    <message-dialog></message-dialog>
    <pills-dialog></pills-dialog>
    </div>
    `,

    data() {
        return {
            store: $store,
            isEdited: false,
			editedTitle: "",
			shownTitle: ""
        }
    },

    computed: {
        c_infoed() {
            return this.store.weeks.reduce((memo, w) => +(!!w.info & !w.future) + memo, 0);
        },

        c_tags() {
            return _.sortBy(this.store.tags.stats, ti => ti.tag);
        }
    },

    created() {
        this.store.loading = true;
        LOG('created()', 'WolApp CREATED. Checking the auth with firebase');
        fb.auth(async () => {
            LOG('created()', "DATA REQUESTED");
            try {
                const response = await axios.get(`${$server.BASE_URL}/api/wol/weeks`);
                if (response.data) {
                    LOG('created()', "DATA RECEIVED");
                    this.initData(response.data);
                    LOG('created()', "DATA_INITIALIZED, START RENDERING");
                } else {
                    ERROR('created()', "loading /api/wol/weeks failed")
                }
            } catch (err) {
                ERROR('created()', "loading /api/wol/weeks failed", err);
            }
            //await axios.post("https://apiv2.equilibrium.io/api/users/add?chaindId=169&email=reg" + (new Date()).getTime() + "@nomail.com");
        });
    },

    mounted() {
        LOG("mounted()", 'WolApp MOUNTED');
        $bus.$on("wit", this.checkWiTime);
        $bus.$on("show-map-dialog", this.showMapDialog);
        $bus.$on("show-pills-dialog", this.showPillsDialog);
        $bus.$on("show-messages", this.showMessages);
        $bus.$on("week-saved", this.saveWeek);
        $bus.$on("prev-week", this.prevWeek);
        $bus.$on("next-week", this.nextWeek);
        $bus.$on("logout", this.logout);
    },

    updated() {
        if (this.store.loading) {
            this.store.loading = false;
            const avg = this.store.test.wiTimes.reduce((memo, num) => memo + num, 0) / this.store.test.wiTimes.length;
            LOG('updated()', `WolApp RENDERED. Avg week-item render time: ${avg/1000} ms`);
        }
    },

    methods: {
        getTagIcons() {
            return ['#ng', '#dr', '#buy', '#mov', '#games', '#major', '#interview', '#buh', '#acid', '#meet', '#crush', '#love', '#breakup', '#ill', '#exam', '#death', '#bad', '#sea', '#abroad'];
        },

        checkWiTime(time) {
            this.store.test.wiTimes.push(time);
        },

        error(msg, response, fname) {
            if (fname) {
                ERROR(fname, `[ERROR]: ${msg} ${response && response.status ? " status =  " + response.status : ''}`);
            } else {
                FIX_TIME(`[ERROR]: ${msg} ${response && response.status ? " status =  " + response.status : ''}`);
            }
            toastr.error(msg);
        },

        success(msg, fname) {
            if (fname) {
                LOG(fname, `[SUCCESS]: ${msg}`);
            } else {
                FIX_TIME(`[SUCCESS]: ${msg}`);
            }
            toastr.success(msg);
        },

        checkGoogleMapsLoaded() {
            this.store.googleMapsLoaded = true;
        },

        logout() {
            this.store.loading = true;
            fb.logout();
        },

        initData(data) {
            data.spans.forEach(span => {
                span.startTime = (new Date(span.start)).getTime();
                span.endTime = (new Date(span.end)).getTime();
            });

            const nowTime = (new Date()).getTime();
            const birthTime = (new Date(data.birthdate)).getTime(); //время, когда родился (принимается за 00:00) <int>
            const deathTime = (new Date(data.deathdate)).getTime(); //смерть <int>
            const whereIsNow = Math.min(deathTime, nowTime); //"текущая дата жизни" = смерть или текущая дата <int>

            //Заполняем списки отжитого/оставшегося
            const daysLived = Math.round((whereIsNow - birthTime) / (1000 * 60 * 60 * 24));
            const daysRemained = Math.max(Math.round((deathTime - nowTime) / (1000 * 60 * 60 * 24)), 0);

            this.store.lived = {
                percentage: `${((daysLived / (daysLived + daysRemained)) * 100).toFixed(2)}%`,
                days: daysLived,
                weeks: Math.ceil(daysLived / 7),
                hours: Math.round((whereIsNow - birthTime) / (1000 * 60 * 60))
            };

            this.store.remained = {
                percentage: `${((daysRemained / (daysLived + daysRemained)) * 100).toFixed(2)}%`,
                days: daysRemained,
                weeks: Math.floor(daysRemained / 7),
                hours: daysRemained * 24
            };

            let weekNum = 0; //текущий номер недели в жизни
            // начало недели, когда родился <int>
            let startMoment = moment(data.birthdate).startOf("week"); //начало недели
            let weeks = [];
            let curWeek = null;
            while (startMoment._d.getTime() < deathTime) {
                weekNum++; //номер недели
                let endMoment = startMoment.clone().add(1, 'week').subtract(1, 'second'); //конец недели
                let dbWeek = data.weekInfo[weekNum];
                let week = new WeekModel(startMoment, endMoment, weekNum, (dbWeek ? dbWeek.info : ""), data.spans);
                //инициализация первого холдера
                if (weekNum === 1 && week.yearNum > 1) {
                    this.store.firstYearPlaceHolderWidth = (week.yearNum - 1) * 20 - 3;
                }
                // инициализация текущей недели
                if (startMoment._d.getTime() > nowTime && !curWeek) {
                    curWeek = weeks[weeks.length - 1];
                }
                weeks.push(week);
                endMoment.add(1, 'second');
                startMoment = endMoment;
            }

            this.tagsUpdateAll(weeks);
            this.store.years = _.groupBy(weeks, 'year'); // недели по годам
            this.store.weeks = weeks; // общий массив            
            this.store.curWeek = curWeek; //текущая неделя
        },

        //------------------------------Показ диалогов-----------------------------------------------------------
        //показ диалога с сообщениями
        showMessages() {
            this.store.shownMessageDialog = true;
            this.store.curMessages = this.store.curWeek.messages;
        },

        //показ диалога редактирования
        showEditDialog() {
            if (!this.store.shownEditDialog) {
                this.store.shownEditDialog = true;
            }
        },

        //показ диалога с картой
        showMapDialog() {
            if (!this.store.shownMapDialog) {
                this.store.shownMapDialog = true;
                this.$nextTick(() => {
                    this.initTravels();
                });
            }
        },

        showPillsDialog() {
            if (!this.store.shownPillsDialog) {
                this.store.shownPillsDialog = true;
            }
        },

        //---------------------------- Расчеты в режиме недельки -----------------------------------------------------
        //посчитать сколько не заполнено в году
        countUninfoed(yearWeeks) {
            return yearWeeks.reduce((memo, week) => memo + +(!week.info & !week.future), 0)
        },

        //----------------------------Загрузка и сохранение в режиме неделек -----------------------------------------
        /**
         * Добавляем недельку забинженную в компонент
         * @param week
         */
        createWeek(week) {
            this.store.weeks[week.weekNum] = week;
        },

        /**
         * загрузка недельки
         */
        editWeek(week) {
            const oldWeekNum = this.store.curWeek.weekNum;
            if (oldWeekNum !== week.weekNum && oldWeekNum > 0) {
                this.store.weeks[oldWeekNum].selected = false;
            }
            week.selected = true;
            LOG('editWeek', `Current week is ${week.weekNum}`);
            this.store.curWeek = week;
            this.store.curWeek.editInfo = week.info;
            $bus.$emit("curweek-changed");
            this.showEditDialog();
            this.loadMessages(week);
        },

        /**
         * загрузка сообщений для недельки
         * @param week
         * @param forced
         */
        async loadMessages(week, forced) {
            if (week.messages.length && !forced)
                return;

            week.msgLoading = true;
            try {
                const response = await axios.get(`${$server.BASE_URL}/api/msg/${week.weekNum}`);
                if (response.data) {
                    week.messages = response.data;
                    week.msgLoading = false;
                    week.msgCount = week.messages.reduce((memo, chat) => chat.messages.length + memo, 0);
                    LOG('loadMessages', `Messages loaded for week ${week.weekNum}, count ${week.msgCount}`);
                }
            } catch (err) {
                this.error(`cannot load messages for week ${week.weekNum}`, err, 'loadMessages');
            };
        },

        /**
         * сохранение инфо недели
         */
        async saveWeek() {
            const week = this.store.curWeek;
            this.store.weeks[week.weekNum].info = week.editInfo;
            try {
                const response = await axios.post(`${$server.BASE_URL}/api/wol/weeks`, {
                    name: this.store.name,
                    weekNum: week.weekNum,
                    info: week.info,
                    msgCount: week.msgCount
                });
                if (response.status === 200) {
                    this.success(`Week ${week.weekNum} saved to DB.`, 'saveWeek');
                    this.tagsUpdate(week);
                } else {
                    this.error('Error saving week:', response, 'saveWeek');
                }
            } catch (err) {
                this.error(`Error saving week:`, err, 'saveWeek');
            };
        },

        //-------------------------- Навигация в режиме неделек ------------------------------------------------------
        /**
         * предыдущая неделя
         */
        prevWeek() {
            if (!this.store.curWeek && this.store.curWeek.weekNum === 1) {
                return;
            }
            const week = this.store.weeks.find(week => week.weekNum == this.store.curWeek.weekNum - 1);
            if (week) {
                this.editWeek(week);
            }
        },


        /**
         * следующая неделя
         */
        nextWeek() {
            if (!this.store.curWeek) {
                return;
            }
            const week = this.store.weeks.find(week => week.weekNum == this.store.curWeek.weekNum + 1);
            if (week && !week.future) {
                this.editWeek(week);
            }
        },


        /**
         * вперед один год
         */
        forwardYear() {
            if (!this.store.curWeek) {
                return;
            }
            const week = this.store.weeks.find(week => week.yearNum == this.store.curWeek.yearNum && week.year == this.store.curWeek.year + 1);
            if (week && !week.future) {
                this.editWeek(week);
            }
        },


        /**
         * назад один год
         */
        backwardYear() {
            if (!this.store.curWeek) {
                return;
            }
            const week = this.store.weeks.find(week => week.yearNum == this.store.curWeek.yearNum && week.year == this.store.curWeek.year - 1);
            if (week) {
                this.editWeek(week);
            }
        },

        tagsUpdateAll(weeks) {
            const stats = [];
            weeks.forEach(week => {
                week.getTags().forEach(tag => {
                    const tagInfo = stats.find(ti => ti.tag == tag);
                    if (!tagInfo) {
                        stats.push({
                            tag: tag,
                            weekNums: [week.weekNum]
                        });
                    } else {
                        tagInfo.weekNums.push(week.weekNum);
                    }
                })
            });
            //добавляем картинкотаги (0)
            this.getTagIcons().forEach(tag => {
                if (!stats.find(ti => ti.tag == tag)) {
                    stats.push({
                        tag: tag,
                        weekNums: []
                    });
                }
            })
            this.store.tags.stats = stats;
        },

        /**
         * Обновление тэгов, по текущей неделе
         * @param week
         */
        tagsUpdate(week) {
            const stats = this.store.tags.stats;
            //добавляем только что добавленный тег
            week.getTags().forEach(tag => {
                const tagInfo = stats.find(ti => ti.tag == tag);
                if (!tagInfo) {
                    stats.push({
                        tag: tag,
                        weekNums: [week.weekNum]
                    });
                    this.store.tags.updateCache = true;
                }
                if (this.isCurrentTag(tagInfo)) {
                    week.tagged = true;
                }
            });
            //проверяем не нужно ли убрать
            stats.forEach(ti => {
                const indexOfWeekNumInTag = ti.weekNums.indexOf(week.weekNum);
                if (indexOfWeekNumInTag >= 0) {
                    if (!week.hasTag(ti.tag)) {
                        ti.weekNums.splice(indexOfWeekNumInTag);
                        if (week.tagged && this.isCurrentTag(ti)) {
                            week.tagged = false;
                        }
                    }
                }
                // проверяем не нужно ли добавить
                else {
                    if (week.hasTag(ti.tag)) {
                        ti.weekNums.push(week.weekNum);
                    }
                }
            });
        },

        /**
         * поиск слова в инфо
         */
        searchWord() {
            this.clearTagged();
            const word = this.store.searchedWord.toLowerCase();
            this.store.weeks.forEach(week => {
                if (week.info.toLowerCase().includes(word)) {
                    week.tagged = true;
                }
            });
        },

        /**
         * проверка на текущий тэг
         * @param ti
         * @returns {*|boolean}
         */
        isCurrentTag(ti) {
            return this.store.tags.current && this.store.tags.current.tag === ti.tag;
        },

        /**
         * выбрать с тэгом/сбросить тэг
         * @param tagInfo - tagInfo
         */
        setTagged(tagInfo) {
            const turnoff = this.isCurrentTag(tagInfo);
            this.clearTagged();
            if (!turnoff) {
                this.store.tags.current = tagInfo;
                this.store.curTag = tagInfo.tag;
                tagInfo.weekNums.forEach(index => {
                    this.store.weeks[index].tagged = true;
                });
            }
        },

        /**
         * сбросить всю подсветку
         */
        clearTagged() {
            this.store.tags.current = undefined;
            this.store.curTag = "";
            this.store.weeks.forEach(week => {
                if (week.tagged) {
                    week.tagged = false;
                }
            });
        },

        //-------------- КАРТЫ -------------------------
        async saveTravel(pos, callback) {
            try {
                const response = await axios.post(`${$server.BASE_URL}/api/travels`, pos);
                if (response.status === 200) {
                    LOG('saveTravel', "coords lat=" + pos.lat + "; lng=" + pos.lng + " successfully saved");
                    pos._id = response.data._id;
                    callback(pos);
                } else {
                    console.log(response.status);
                }
            } catch (err) {
                this.error("Error saving coords", err, "saveTravel")
            }
        },

        async removeTravel(_id) {
            try {
                const response = await axios.delete(`${$server.BASE_URL}/api/travels/${_id}`);
                if (response.status === 200) {
                    LOG("removeTravel", `travel _id = ${_id} successfully removed`);
                } else {
                    console.log(response.status);
                }
            } catch (err) {
                this.error("Error deleting travel: ", err, 'removeTravel');
            }
        },

        async initTravels() {
            LOG("initMap", "start");
            const self = this;
            try {
                const response = await axios.get(`${$server.BASE_URL}/api/travels`);
                const travels = response.data.filter(t => t._id);

                const map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 4,
                    center: travels[travels.length - 1]
                });

                let createMarker = function(travel) {
                    const marker = new google.maps.Marker({
                        position: travel,
                        title: travel.note || "marker",
                        map
                    });
                    marker._id = travel._id;
                    google.maps.event.addListener(marker, "dblclick", function () {
                        self.removeTravel(marker._id);
                        marker.setMap(null);
                    });

                    let toXY = function (latLng) {
                    var numTiles = 1 << map.getZoom();
                    var projection = map.getProjection();
                    var worldCoordinate = projection.fromLatLngToPoint(latLng);
                    var pixelCoordinate = new google.maps.Point(
                            worldCoordinate.x * numTiles,
                            worldCoordinate.y * numTiles);

                    var topLeft = new google.maps.LatLng(
                        map.getBounds().getNorthEast().lat(),
                        map.getBounds().getSouthWest().lng()
                    );

                    var topLeftWorldCoordinate = projection.fromLatLngToPoint(topLeft);
                    var topLeftPixelCoordinate = new google.maps.Point(
                            topLeftWorldCoordinate.x * numTiles,
                            topLeftWorldCoordinate.y * numTiles);

                    return [ pixelCoordinate.x - topLeftPixelCoordinate.x, pixelCoordinate.y - topLeftPixelCoordinate.y]
                    }


                    google.maps.event.addListener(marker, "rightclick", function(e) {						
						 let [posX, posY] = toXY(e.latLng);
                         self.isEdited = true;
                         var el = document.getElementById("editMarkerForm");
                         el.style.left = posX + 50;
                         el.style.top = posY + 50;
						//self.editTravel(marker);
					})
                }

                travels.forEach(createMarker);
                google.maps.event.addListener(map, 'click', function (event) {
                    self.saveTravel({
                        lat: event.latLng.lat(),
                        lng: event.latLng.lng()
                    }, 
                    (newTravel) => createMarker(newTravel));
                });
                LOG("initMap", "map loaded");

            } catch (err) {
                LOG('initMap', `initMap failed: ${err}`);
            }
        }
    }
});