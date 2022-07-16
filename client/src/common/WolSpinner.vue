<script>
export default {
    props: ['store']    
}
</script>

<template>
    <div class="spinner-parent" v-if="store.loading">
        <div class="spinner-elem">
            <md-progress-spinner md-mode="indeterminate" :md-diameter="160"></md-progress-spinner>
        </div>
    </div>
</template>

<style>
.spinner-parent {
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    align-content: center;
    justify-content: center;
    overflow: auto;
}
</style>


