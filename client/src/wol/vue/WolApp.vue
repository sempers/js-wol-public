<script>
	import { LOG, ERROR } from "../../logs.js";
	import $bus from "../../bus.js";
	import $store from "../store.js";
	import WeekModel from "../WeekModel.js";
	import WolSpinner from "../../common/WolSpinner.vue";
	import WolTagbar from "./WolTagbar.vue";
	import WeekItem from "./WeekItem.vue";
	import EditDialog from "./EditDialog.vue";
	import MapDialog from "./MapDialog.vue";
	import PhotoDialog from "./PhotoDialog.vue"
	import { dateToWeekNum } from "../../msg/yearWeeks.js"

	export default {
		data() {
			return {
				store: $store
			}
		},

		components: {
			WeekItem,
			EditDialog,
			MapDialog,
			PhotoDialog,
			WolSpinner,
			WolTagbar
		},

		computed: {
			c_tags() {
				return this.store.tags.stats.sortBy(ti => ti.tag);
			},

			c_infoed() {
            	return this.store.weeks.slice(1).reduce((memo, w) => +(!!w.info & !w.future) + memo, 0);
        	},

			c_photos() {
            	return this.store.curWeek ? this.store.curWeek.photos.sortBy(x => x.totalDate): [];
        	}
		},

		created() {
			this.store.loading = true;
			
			this.init();

			this.$watch("store.curWeek", (newValue) => {
				let query = Object.assign({}, this.$route.query);
				if (!newValue) {
					delete query.w;
				} else {
					query.w = newValue.weekNum;
				}
				this.$router.replace({ query }).catch((err) => {
					if (err.name != "NavigationDuplicated") {
						console.dir(err);
					}
				});
			});

			this.$watch("store.shownEditDialog", (newValue) => {
				let query = Object.assign({}, this.$route.query);
				query.edit = newValue;
				this.$router.replace({ query }).catch((err) => {
					if (err.name != "NavigationDuplicated") {
						console.dir(err);
					}
				});
			});

			$bus.$on("show-map-dialog", this.showMapDialog);
		},

		mounted() {
			LOG("mounted()", "WolApp MOUNTED");
		},

		updated() {
			if (this.store.loading) {
				this.store.loading = false;
				const avg = this.store.test.wiTimes.reduce((memo, num) => memo + num, 0) / (this.store.test.wiTimes.length * 1000);
				LOG("updated()", `WolApp RENDERED. Avg week-item render time: ${avg} ms`);
			}
		},

		methods: {
			async init() {
				LOG("init", "DATA REQUESTED");
				try {
					const response = await axios.get(`/api/wol/weeks`);
					if (response.data) {
						LOG("init", "DATA RECEIVED");
						this.initData(response.data);
						LOG("init", "DATA_INITIALIZED, START RENDERING");
					} else {
						ERROR("init", "loading /api/wol/weeks failed", response, 1);
					}
				} catch (err) {
					ERROR("init", "loading /api/wol/weeks failed", err, 1);
				}
				this.readQueryParams();
			},

			readQueryParams() {
				let query = this.$router.history.current.query;
				if (query.w && query.edit) {
					this.editWeek(this.store.weeks[+query.w]);
				}
			},

			checkWiTime(time) {
				this.store.test.wiTimes.push(time);
			},

			checkGoogleMapsLoaded() {
				this.store.googleMapsLoaded = true;
			},

			initData(data) {
				//подготавливаем спаны для ускорения
				data.spans.forEach((span) => {
					span.startTime = new Date(span.start).getTime();
					span.endTime = new Date(span.end).getTime();
				});

				const nowTime = new Date().getTime();
				const birthTime = new Date(data.birthdate).getTime(); //время, когда родился (принимается за 00:00) <int>
				const deathTime = new Date(data.deathdate).getTime(); //смерть <int>
				const whereIsNow = Math.min(deathTime, nowTime); //"текущая дата жизни" = смерть или текущая дата <int>

				//Заполняем списки отжитого/оставшегося
				const daysLived = Math.round((whereIsNow - birthTime) / (1000 * 60 * 60 * 24));
				const daysRemained = Math.max(Math.round((deathTime - nowTime) / (1000 * 60 * 60 * 24)),	0);

				this.store.lived = {
					percentage: `${((daysLived / (daysLived + daysRemained)) * 100).toFixed(2)}%`,
					days: daysLived,
					weeks: Math.ceil(daysLived / 7),
					hours: Math.round((whereIsNow - birthTime) / (1000 * 60 * 60)),
				};

				this.store.remained = {
					percentage: `${((daysRemained / (daysLived + daysRemained)) * 100).toFixed(2)}%`,
					days: daysRemained,
					weeks: Math.floor(daysRemained / 7),
					hours: daysRemained * 24,
				};

				let weekNum = 0; //текущий номер недели в жизни				
				let startMoment = moment(data.birthdate).startOf("week"); // начало недели, когда родился 
				let weeks = [null];
				let curWeek = null;
				while (startMoment._d.getTime() < deathTime) {
					weekNum++; //номер недели
					let endMoment = startMoment.clone().add(1, "week").subtract(1, "second"); //конец недели
					let dbWeek = data.weekInfo[weekNum];
					let week = new WeekModel(dbWeek, startMoment, endMoment, weekNum, data.spans);
					//инициализация первого холдера
					if (weekNum === 1 && week.yearNum > 1) {
						this.store.firstYearPlaceHolderWidth = (week.yearNum - 1) * 20 - 3;
					}
					// инициализация текущей недели
					if (startMoment._d.getTime() > nowTime && !curWeek) {
						curWeek = weeks[weeks.length - 1];
					}
					weeks.push(week);
					endMoment.add(1, "second");
					startMoment = endMoment;
				}

				this.store.weeks = weeks; // общий массив
				$bus.$emit("tags-update-all");
				this.store.years = this.store.weeks.groupBy("year"); // недели по годам				
				this.store.curWeek = curWeek; //текущая неделя
			},

			showMapDialog() {
				if (!this.store.shownMapDialog) {
					this.store.shownMapDialog = true;
				}
			},

			countUninfoed(yearWeeks) {
				return yearWeeks.reduce((memo, week) => memo + +(!week.info & !week.future), 0);
			},

			/**
			 * загрузка недельки
			 */
			async editWeek(week) {
				if (!this.store.curWeek)
					return;

				const oldWeekNum = this.store.curWeek.weekNum;
				if (oldWeekNum !== week.weekNum && oldWeekNum > 0) {
					this.store.weeks[oldWeekNum].selected = false;
				}
				week.selected = true;
				LOG("editWeek", `Current week is ${week.weekNum}`);

				this.store.curWeek = week;
				if (!this.store.shownEditDialog) {
					this.store.shownEditDialog = true;
				}
				await this.loadMessages(week);
				await this.loadPhotos(week);
				await this.patchWeek(week);
			},

			// частичное обновление недельки (каунты)
			async patchWeek(week) {
				if (week.patched)
					return;
				try {
					const response = await axios.put(`/api/wol/weeks/${week.weekNum}`, [week.msgCount, week.photoCount, week.year, week.yearNum]);
					if (response == 200) {
						week.patched = true;
					}
				} catch (err) {
					ERROR("patchCounts", "error", err);
				}
			},

			/**
			 * загрузка сообщений для недельки
			 * @param week
			 * @param forced
			 */
			async loadMessages(week, forced) {
				if (week.messages.length && !forced) return;

				week.msgLoading = true;
				try {
					const response = await axios.get(`/api/msg/${week.weekNum}`);
					if (response.data) {
						week.messages = response.data;
						week.msgLoading = false;
						week.msgCount = week.messages.reduce((memo, chat) => chat.messages.length + memo, 0);
						LOG("loadMessages",	`Messages loaded for week ${week.weekNum}, count ${week.msgCount}`);
					}
				} catch (err) {
					ERROR("loadMessages", `cannot load messages for week ${week.weekNum}`, err,	1);
				}
			},

			/**
			 * сохранение инфо недели
			 */
			async saveWeek() {
				const week = this.store.curWeek;
				if (!week) return;
				
				const changed = week.info !== week.editInfo;
				week.info = week.editInfo;
				try {
					const response = await axios.post(`/api/wol/weeks`, {
						name: week.name,
						weekNum: week.weekNum,
						info: week.info,
						msgCount: week.msgCount,
						photoCount: week.photoCount,
						year: week.year,
						yearNum: week.yearNum
					});
					if (response.status === 200) {
						LOG("saveWeek",	`Week ${week.weekNum} saved to DB.`,1);
						if (changed) {
							week.updateTags();
							$bus.$emit("tags-update-week", week);
						}
					}
				} catch (err) {
					ERROR("saveWeek", `Error saving week:`, err, "saveWeek", 1);
				}
			},

			// Фотки----------------------------------------------
			async loadBigPreview(photo) {
				if (!photo.big_preview) {
					try {
						const escapedPath = btoa(encodeURIComponent(photo.path.replace("disk:/","")));
						let t0 = new Date();
						const response = await axios.get(`/api/wol/photo/preview/${escapedPath}?size=XXL&resource_id=${photo.resource_id}`);
						LOG("loadBigPreview", `Db time: ${(new Date()).getTime() - t0.getTime()} ms`);
						photo.big_preview = response.data;
						photo.removed = false;
						LOG("loadBigPreview", `Preview successfully loaded`);
					} catch (e) {
						ERROR("loadBigPreview", `preview not loaded`, e, 1);
						return;
					}
				}
				if (photo.big_preview) {
					this.store.curPhoto = photo;
					this.store.shownPhotoDialog = true;
				}
        	},

			async removePhoto(photo) {
				photo = photo || this.store.curPhoto;
				if (!photo) return;
				try {
					/*const response = await axios.delete(`/api/wol/photo/${photo._id}`);
					if (response.status == 200) {
						photo.removed = true;
						this.nextPhoto();
					}*/
					this.nextPhoto();
				} catch (err) {
					ERROR("removePhoto", "removing error", err);
				}
			},

			async savePhoto(photo) {
				try {
					let oldWeekNum = photo.weekNum;
					let newDate = moment(photo.manual_date, "DD.MM.YYYY")._d;
					let newWeekNum = dateToWeekNum(newDate);
					photo.weekNum = newWeekNum;
					photo.manual_date = newDate;
					photo.totalDate = newDate;
					const weeks = this.store.weeks;
					const response = await axios.put(`/api/wol/photos`, photo);
					if (response.status == 200) {
						if (weeks[oldWeekNum].photos && weeks[oldWeekNum].photos.length) {
							weeks[oldWeekNum].photos = weeks[oldWeekNum].photos.reject(x => x._id == photo._id);
						}
						if (weeks[newWeekNum].photos && weeks[newWeekNum].photos.length) {
							weeks[oldWeekNum].photos.push(photo);
						}
						LOG("savePhoto", `Manual date ${newDate} on photo ${photo.resource_id} successfully saved`, 1);
					}
				}
				catch (err) {
					ERROR("savePhoto", "error when saving photo", err, 1);
				}
			}, 

			async loadPhotos(week, forced) {
				if (week.photos.length > 0 && !forced) return;
				week.photoLoading = true;
				try {
					const response = await axios.get(`/api/wol/photos/${week.weekNum}`);
					if (response.data) {
						let data = response.data;
						data.forEach(p => {
							p.totalDate = p.manual_date ? p.manual_date: p.date;
						 	p.edited = false;
						});
						week.photos = data;
						week.photoLoading = false;
						week.photoCount = week.photos.length;
						LOG("loadPhotos",  `Photos loaded for week ${week.weekNum}, count ${week.photoCount}`);
					}
				} catch (err) {
					ERROR("loadPhotos",	`cannot load messages for week ${week.weekNum}`, err, 1);
				}
			},

			async nextPhoto() {
            if (!this.store.curWeek || !this.store.curWeek.photos.length)
                return;
				var index = this.c_photos.findIndex(x => x.resource_id == this.store.curPhoto.resource_id);
				while (index >= 0 && index <= this.store.curWeek.photos.length-1) {
					if (index == this.store.curWeek.photos.length-1)
					{
						index = 0;
					} else {
						index++;
					}
					if (!this.c_photos[index].removed) {
						await this.loadBigPreview(this.c_photos[index]);
						break;
					}					
				}
        	},


			async prevPhoto() {
				if (!this.store.curWeek || !this.store.curWeek.photos.length)
					return;
				var index = this.c_photos.findIndex(x => x.resource_id == this.store.curPhoto.resource_id);
				while (index >= 0) {
					if (index == 0)
					{
						index = this.store.curWeek.photos.length-1;
					} else {
						index--;
					}
					if (!this.c_photos[index].removed) {
						await this.loadBigPreview(this.c_photos[index]);
						break;
					}					
				} 
			},

			//-------------------------- Навигация в режиме неделек ------------------------------------------------------
			/**
			 * предыдущая неделя
			 */
			prevWeek() {
				if (!this.store.curWeek || this.store.curWeek.weekNum === 1) 
					return;
				const week = this.store.weeks[this.store.curWeek.weekNum - 1]; 
				if (week) {
					this.editWeek(week);
				}
			},

			/**
			 * следующая неделя
			 */
			nextWeek() {
				if (!this.store.curWeek) 
					return;
				const week = this.store.weeks[this.store.curWeek.weekNum + 1];
				if (week && !week.future) {
					this.editWeek(week);
				}
			},

			/**
			 * вперед один год
			 */
			forwardYear() {
				if (!this.store.curWeek)
					return;
				const week = this.store.weeks.find(week => week.yearNum == this.store.curWeek.yearNum && week.year == this.store.curWeek.year + 1);
				if (week && !week.future) {
					this.editWeek(week);
				}
			},

			/**
			 * назад один год
			 */
			backwardYear() {
				if (!this.store.curWeek) 
					return;
				const week = this.store.weeks.find(week => week.yearNum == this.store.curWeek.yearNum && week.year == this.store.curWeek.year - 1);
				if (week && !week.future) {
					this.editWeek(week);
				}
			},
		},
	};
</script>

<template>
	<div class="app-layout" id="wolApp">
		<wol-spinner :store="store"></wol-spinner>
		<transition name="fade">
			<div class="wol-container" v-show="!store.loading">
				<div class="wol-header">
        			<div class="lived">
            			<strong>Прожито {{store.lived.percentage}}</strong>, недель: <strong>{{store.lived.weeks}}</strong>, дней: <strong>{{store.lived.days}}</strong>, часов: <strong>{{store.lived.hours}}</strong>
        			</div>
					<div class="weeks-infoed">
						Недель заполнено: <strong>{{c_infoed}} ({{((c_infoed / store.lived.weeks) * 100).toFixed(1) + '%'}})</strong>
					</div>
					<div class="remained" style="">
						<strong>Осталось {{store.remained.percentage}}</strong>, недель: <strong>{{store.remained.weeks}}</strong>, дней: <strong>{{store.remained.days}}</strong>, часов: <strong>{{store.remained.hours}}</strong>
					</div>
    			</div>
				<div style="position: relative">
					<table class="year-table clearfix">
						<tr	v-for="(year_weeks, year, index) in store.years" :key="year">
							<td class="year-row year-header">
								{{ year }}<span	class="uninfoed" v-if="countUninfoed(year_weeks)">({{ countUninfoed(year_weeks) }})</span>
							</td>
							<td class="year-row year-weeks">
								<div class="week-placeholder" v-if="index === 0" :style="'width:' + store.firstYearPlaceHolderWidth + 'px'"></div>
								<week-item
									v-for="week in year_weeks"
									:key="week.weekNum"
									:week="week"
									@week-clicked="editWeek"
									@wit="checkWiTime"
								></week-item>
							</td>
						</tr>
					</table>
					<wol-tagbar></wol-tagbar>
				</div>
			</div>
		</transition>
		<edit-dialog :week="store.curWeek" @prev-week="prevWeek" @next-week="nextWeek"
					 @week-saved="saveWeek" @save-photo="savePhoto" @load-preview="loadBigPreview">
		</edit-dialog>

		<map-dialog ></map-dialog>

		<photo-dialog :photo="store.curPhoto"  @prev-photo="prevPhoto" @next-photo="nextPhoto" @remove-photo="removePhoto"></photo-dialog>
	</div>
</template>

<style lang="less">
@import "../../common/wol-vars.less";
@import "../../common/wol-basic.less";
#wolApp {
	font-family: Helvetica, Arial, sans-serif !important;
    font-size: 14px !important;
    line-height: 20px !important;
}

.wol-container {
	width: 1120px;
	margin: 0 auto;
}

.wol-header {
    padding-bottom: 30px;
    padding-top:58px;

    .lived {
        float:left;
    }

    .weeks-infoed {
        color: #448aff;
        margin-left: 45px;
        float:left;
    }

    .remained {
        float: right;
        position:relative;
        left:-27px
    }
}

.year-table {
	margin: 0;
	width: 1120px;
}

.year-row {
	height: 20px;
	vertical-align: middle;

	&.year-header {
		font-family: Roboto;
		color: @window-foreground;
		font-weight: bold;
		display: inline-block;
		width: 50px;
		font-size: 15px;
	}
}

.uninfoed {
	color: @gray;
	font-size: 10px;
	font-weight: normal;
	position: relative;
	top: -3px;
}

.week-placeholder {
	border: 0;
	margin: 0;
	display: inline-block;
	background: @window-background;
}	
</style>