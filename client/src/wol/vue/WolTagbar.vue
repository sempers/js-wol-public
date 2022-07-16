<script>
import $store from "../store.js"
import $bus from "../../bus.js"
import { allowedPNG } from "../WeekModel";

export default {
    data() {
        return {
            store: $store,
            allowedPNG
        }
    },

    computed: {
        c_tags() {
            return this.store.tags.stats.sortBy(ti => ti.tag);
        }
    },

    created() {
        $bus.$on("tags-update-all", this.tagsUpdateAll);
        $bus.$on("tags-update-week", this.tagsUpdateWeek);
    },

    methods: {
        addWeekNum(tag, num) {
            const ti = this.store.tags.stats.find(ti => ti.tag == tag);
            if (!ti) {
                this.store.tags.stats.push({ tag, weekNums: [num] });
            } else if (!ti.weekNums.includes(num)) {
                ti.weekNums.push(num);
            }
        },

        tagsUpdateAll() {
            this.store.tags.stats = [];
            this.store.weeks.slice(1).forEach(week => {
                week.getTags().forEach(tag => {
                    this.addWeekNum(tag, week.weekNum);
                });
            });
		},

        /**
         * Обновление тэгов, по текущей неделе
         * @param week
         */
        tagsUpdateWeek(week) {
            const stats = this.store.tags.stats;
            const num = week.weekNum;
            //добавляем только что добавленный тег
            const tags = week.getTags();
            tags.forEach(tag => {
                this.addWeekNum(tag, num);
                if (this.store.curTag == tag) {
                    week.tagged = true;
                }
            });
            //проверяем не нужно ли убрать
            stats.forEach(ti => {
                if (!week.hasTag(ti.tag) && ti.weekNums.includes(num)) {
                    ti.weekNums.splice(ti.weekNums.indexOf(num), 1);
                    if (week.tagged && this.store.curTag == ti.tag) {
                        week.tagged = false;
                    }
                }
                if (!week.tagged && this.store.curTag == ti.tag) {
                    week.tagged = true;
                }
            });
        },

            /**
			 * поиск слова в инфо
			 */
			searchWord() {
				this.clearTagged();
				const word = this.store.searchedWord.toLowerCase();
				this.store.weeks.slice(1).forEach(week => {
					if (!week) return;
					if (week.info.toLowerCase().includes(word)) {
						week.tagged = true;
					}
				});
			},

			/**
			 * выбрать с тэгом/сбросить тэг
			 * @param ti - tagInfo
			 */
			setTagged(ti) {
				const turnoff = this.store.curTag == ti.tag;
				this.clearTagged();
				if (!turnoff) {
					this.store.curTag = ti.tag;
					ti.weekNums.forEach((index) => {
						this.store.weeks[index].tagged = true;
					});
				}
			},

			/**
			 * сбросить всю подсветку
			 */
			clearTagged() {
				this.store.curTag = "";
				this.store.weeks.slice(1).forEach((week) => {
					if (week.tagged) {
						week.tagged = false;
					}
				});
			},
    }
};
</script>

<template>
	<div class="tag-bar">
		<div class="tag-bar-item" v-for="ti in c_tags" :key="ti.tag">
			<div
				:class="'wi-outer wi-inner ' + ti.tag"
				v-if="allowedPNG.includes(ti.tag)"
			></div>
			<a	href
				v-if="ti && ti.tag && ti.weekNums.length"
				@click.prevent="setTagged(ti)"
				class="tag-link"
				:class="{
					'strong': ti.weekNums.length > 20,
					'tag-selected': ti.tag == store.curTag,
				}">
				{{ "#" + ti.tag }} ({{ti.weekNums.length}})
			</a>
		</div>
		<md-field>
			<label>Поиск</label>
			<md-input
				type="text"
				v-model="store.searchedWord"
				style="width: 300px"
			/>
		</md-field>
		<div style="text-align: center">
			<md-button type="button" @click="searchWord()"
				>Искать в описаниях</md-button
			>
		</div>
	</div>
</template>

<style lang="less">
	@import "../../common/wol-vars.less";

    .strong {
        font-weight: bold;
    }

	.tag-bar {
		float: right;
		position: absolute;
		left: 1140px;
		top: 0;
		background-color: #eee;
		border-radius: 4px;
		border: 1px solid transparent;
		list-style: none;
		padding: 12px 16px;
		width: 300px;
		line-height: 24px;

		.tag-bar-item {
			display: inline-block;
			margin-right: 12px;

			.wi-outer {
				position: relative;
				top: 2px;
			}
		}

		a:hover {
			text-decoration: none;
			color: blue;
		}

		a,
		a:visited,
		a:active {
			text-decoration: none;
			font-size: 0.9em;
			color: #448aff;
		}

		a.tag-link.tag-selected {
			font-weight: bold;
			color: @color-selected !important;
		}
	}
</style>