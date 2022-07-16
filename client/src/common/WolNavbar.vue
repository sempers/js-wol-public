<script>
	import $bus from '../bus.js'
	import $config from "../config.js"
	import WolNavBtn from "./WolNavBtn.vue";

	export default {
		props: ["current"],

		components: { WolNavBtn },

		data() {
			return {
				modules: $config.modules
			};
		},

		methods: {
			emit(key) {
            	$bus.$emit(key);
        	}
		}
	}
</script>

<template>
	<div class="wol-navbar">
		<wol-nav-btn v-show="modules.includes('wol')" :icon="'directions_run'" :class="{'active': current == 'wol'}" :link="'/'" :text="'Weeks of Life'" ></wol-nav-btn>
		<wol-nav-btn v-show="modules.includes('money')" :icon="'monetization_on'" :class="{'active': current == 'money'}" :link="'money'" :text="'Money'" ></wol-nav-btn>
		<wol-nav-btn v-show="modules.includes('msg') && current != 'money'" :icon="'message'" :class="{'active': current == 'msg'}" :link="'msg'" :text="'Messages'" ></wol-nav-btn>
		<wol-nav-btn v-show="current == 'wol' && modules.includes('travel')" :icon="'location_on'" :link="''" @click.native.capture="emit('show-map-dialog')" :text="'Travel'"></wol-nav-btn>
		<wol-nav-btn :icon="'exit_to_app'" :link="''" @click.native.capture="emit('logout')" :text="'Log out'"></wol-nav-btn>
    </div>
</template>

<style lang="less">
	.wol-navbar {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		top: 0;
		left: 0;
		padding: 4px 0 0 0;
		z-index: 1000;

		&:first-child {
			margin-left:6px;
		}
	}
</style>

