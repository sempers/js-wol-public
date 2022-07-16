
<script>
import $store from "../store.js"

export default {
	props: ["photo", "dswitch"],
	data() {
		return {
			store: $store,
			photoNavigating: false
		}
	},
	watch: {
		photo() {
			this.photoNavigating= false;
		}
	},
    methods: {
        onKeyDown(event) {
            if (event.keyCode == 39 && event.ctrlKey) {
                //right arrow
                this.$emit("next-photo");
				this.photoNavigating= true;
            }
            if (event.keyCode == 37 && event.ctrlKey) {
                //left arrow
                this.$emit("prev-photo");
				this.photoNavigating = true;
            }
        },
    }
};
</script>
<template>
	<md-dialog
		id="photoDialog"
		class="photo-dialog"
		v-if="photo"
		:md-active.sync="store.shownPhotoDialog"
        @keydown="onKeyDown($event)">
		<md-dialog-content >
			<div id="spinner" v-show="photoNavigating">
				<md-progress-spinner md-mode="indeterminate" class="photo-spinner" :md-diameter="100" ></md-progress-spinner>
			</div>			
			<img v-bind:src="photo.big_preview" @click="store.shownPhotoDialog = false"/>
			<div class="photo-caption-name">{{ photo.name }}</div>
			<div class="photo-caption-date">{{ photo.totalDate | date }}</div>
			<div class="photo-remove">
				<div class="action-btn" @click="$emit('remove-photo', photo)">
                <md-button class="md-icon-button md-dense">
                    <md-icon>delete</md-icon>
                </md-button>
            	</div>
			</div>
		</md-dialog-content>
	</md-dialog>
</template>

<style lang="less">
#photoDialog {
	z-index: 2000;

	.md-dialog-content {
		padding: 6px;
	}

	#spinner {
		position: absolute;
		left:0;
		top: 0;
		width: 100%;
		height: 100%;
		background-color: transparent;
		display: flex;
    	align-items: center;
    	align-content: center;
    	justify-content: center;
		z-index: 2001;
	}

	.photo-spinner {
		color: white;
	}
}

.photo-caption-name {
	position: absolute;
	left: 50px;
	bottom: 50px;
	color: white;
	background-color: #555;
}

.photo-caption-date {
	position: absolute;
	right: 50px;
	bottom: 50px;
	color: white;
	background-color: #555;
}

.photo-remove {
	position: absolute;
	right: 50px;
	top: 50px;
	color: white;
	font-size:28px;

	.md-icon {
		color: white !important;
	}
}
</style>