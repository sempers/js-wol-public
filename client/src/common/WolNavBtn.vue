<script>
export default {
    props: ['link', 'icon', 'text', 'current'],
}
</script>

<template>
    <div class='wol-navbtn'>
        <router-link :to="link" @click="$emit('clicked')">
        <md-icon >{{icon}}</md-icon>&nbsp;{{text}}
        </router-link>
    </div>
</template>

<style lang="less">
@import "./wol-vars.less";

.wol-navbtn a, .wol-navbtn a:hover, .wol-navbtn a:link, .wol-navbtn a:visited, .wol-navbtn a:focus, .wol-navbtn a:active {
    text-decoration: none !important;
    color: initial !important;
}

.wol-navbtn {
    font-family: Dosis, "Source Sans Pro", "Helvetica Neue", Arial, sans-serif;
    font-size: 16px;
    padding: 6px 12px 3px 12px;
    border: 1px solid #ccc;
    border-radius: @bradius;
    background-color: @lgray;
    color:@black;
    margin:3px;
    z-index:1000;
    opacity:1.0;
}

.wol-navbtn.active {
    background-color:lightblue;
}

.wol-navbtn:not(.active):hover {
    background-color: #dadada;
}

.wol-navbtn i.md-icon {
    position:relative;
    top:-2px;
}
</style>

