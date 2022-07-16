<script>
export default {
    props: ['week'],

    data() {
        return {
            mounted: false,
            created: 0,
            updated: 0,
        }
    },

    computed: {
        c_tags_classes() {
            return this.week.getTagClasses() || "";
        }
    },

    created() {
        this.created = new Date();
    },

    mounted() {
        this.$emit("wit", (new Date()).getTime() - this.created.getTime());
    }
}
</script>

<template>
    <div class="wi-outer" :class="{selected: week.selected, infoed: !!week.info, tagged: week.tagged}" @click="$emit('week-clicked', week)">
        <div class="wi-inner" :class="week.future">
            <template v-if="!week.future">
                <div class="wi-bg" :style="'background-color:' + week.bgcolor" ></div>
                <div class="wi-bg2" :style="'border-bottom: 12px solid '+ week.bgcolor2" v-if="week.bgcolor2"></div>
                <div class='wi-icon' :class="c_tags_classes"></div>
            </template>
            <div class="wi-popup-triangle"></div>
            <div class="wi-popup md-elevation-4" >
                <div class="desc">{{week.desc}}</div>
                <div class="desc-flags">{{week.flags}}</div>
                <div class="desc-counts">✉: {{week.msgCount}} 📷: {{week.photoCount}}</div>
                <div class="desc-info">{{week.info}}</div>                
            </div>
        </div>
    </div>
</template>

<style lang="less">
@import "../../common/wol-vars.less";
@import "../../common/wol-icons.less";

.wi-outer {
    margin: 0;
    padding: 0;
    border: 3px solid @window-background;
    display: inline-block;

    &.selected {
        border-color: @color-selected;
    }

    &.tagged {
        border-color: @color-tagged;
    }
}

.wi-inner {
    width: 12px;
    height: 12px;
    border: 1px solid @gray;
    position: relative;

    &.future {
        border: 1px dotted @window-foreground;
        background-color: white;
    }

    .infoed & {
        border: 1px solid @window-foreground;
    }
}

.wi-bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 12px;
    height: 12px;
    border: 0;
    opacity: 0.5;
    z-index: 1;

    .infoed & {
        opacity: 1.0;
    }
}

.wi-bg2 {
    position: absolute;
    left: 0;
    top: -12px;
    width: 0;
    height: 0;
    z-index: 2;
    border-width: 12px;
    border-top: 12px solid transparent;
    border-left: 12px solid transparent;
    opacity: 0.5;

    .infoed & {
        opacity: 1.0;
    }
}

.wi-icon {
    position: absolute;
    left: 0;
    top: 0;
    width: 12px;
    height: 12px;
    border: 0;
    z-index: 3;
}

.wi-popup-triangle {
    width: 16px;
    height: 16px;
    background-image: url(../../common/tags/triangle.png);
    position: absolute;
    left: 3px;
    display: none;
    z-index: 5;
}

.wi-popup {
    width: 280px;
    border: 1px solid @window-foreground;
    border-radius: 4px;
    background: #eee;
    color: @window-foreground;
    font-size: 0.75em;
    padding: 4px;
    overflow-x: auto;
    display: none;
    position: absolute;
    left: 18px;
    top: -4px;
    z-index: 4;
}

.wi-outer:hover .wi-popup,
.wi-outer:hover .wi-popup-triangle {
    display: block !important;
}

.desc {
    color: @window-foreground;
    font-weight: bold;
    line-height: 1.2;
}

.desc-flags {
    display: inline-block;
}

.desc-info {
    font-style: normal;
    font-size: 11px;
    line-height: 1.2 !important;
    color: @window-foreground;
    white-space: pre-wrap;
}
.desc-counts {
    display:inline-block;
    margin-left: 8px;
    color: @black;
}
</style>