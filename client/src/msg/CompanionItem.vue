<script>
import $store from "./store.js";
import $bus from "../bus.js"

export default {
    data() {
        return {
            store: $store,
            mergeTo: null,
            allNames: []
        };
    },

    props: ["item"],

    computed: {
        groups() {
            return ["Семья", "Девушка", "Друзья", "Лицей", "Институт", "Купавна", "Интернет-знакомые", "Коллеги", "Коллеги(Вигоур)", "Коллеги(ВЭБ)", "Коллеги(Экви)", "Соседи", "Бывшие", "Случайные"];
        },
    },

    methods: {
        edit() {
            this.item.edited = !this.item.edited;
        }, 
        save() {
            $bus.$emit("save-comp", this.item.companion);
            this.item.edited = false;
        },
        merge(id) {
            if (!this.item.merged) {
                this.item.merged = true;
                this.allNames = this.store.companionsData.map(x => x._id);
            } else {
                $bus.$emit("merge", id, this.mergeTo);
            }
        },
        showMessages() {
            $bus.$emit("get-messages", this.item._id);
        }
    }
}
</script>
<template>
	<md-card class="comp-card" >
		<md-card-header>
			<div class="md-title">{{ item._id }}</div>
		</md-card-header>
		<md-card-content>
            <div class="messages">
                <md-button class="md-icon-button md-dense top-button" @click="showMessages()" style="float:right">
                    <md-icon>article</md-icon>
                </md-button>
                <strong>Сообщения: {{item.cnt}}</strong><br><br>
                С:&nbsp;&nbsp;&nbsp;{{ item.minDate }} <br />
                По:&nbsp;{{ item.maxDate }}<br />
            </div>
            <template v-if="!item.edited && item.companion">
                <div class="data-row">Пол: <span 
                    ><md-icon
                        :class="{
                            'icon-man': item.companion.sex == 'man',
                            'icon-woman': item.companion.sex == 'woman',
                            'icon-unknown': !item.companion.sex || item.companion.sex == 'unknown',
                        }"
                        >face</md-icon
                    ></span></div>                
                <div class="data-row" v-show="item.companion.full_name">Имя: {{item.companion.full_name}}</div>
                <div class="data-row" v-show="item.companion.group">Группа: {{item.companion.group}}</div>
                <div class="data-row" v-show="item.companion.note">{{item.companion.note}}</div>
            </template>		
            <template v-if="item.edited && item.companion">
                <div class="md-layout">                
                    <md-field class="mb0">
                        <label>Полное имя</label>
                        <md-input v-model="item.companion.full_name" v-on:keyup.13.stop="save()"/>
                    </md-field>
                    <md-field class="mb0">
                        <label>Группа</label>
                        <md-select	class="chart-select" v-model="item.companion.group">
                            <md-option :value="g" v-for="g in groups">{{g}}</md-option>
                        </md-select>
                    </md-field>
                    <md-field class="mb0">
                        <label>Описание</label>
                        <md-input v-model="item.companion.note" v-on:keyup.13.stop="save()"/>
                    </md-field>                    
                    <md-field class="mb0">
                        <label>Пол</label>
                        <md-select	class="chart-select" v-model="item.companion.sex">
                            <md-option value="man">Муж</md-option>
                            <md-option value="woman">Жен</md-option>
                            <md-option value="unknown">Неизв</md-option>
                        </md-select>
                    </md-field>                
                </div>
            </template>
            <template v-if="item.merged">
                <div class="md-layout-item">
                   <md-autocomplete class="mb0" v-model="mergeTo" :md-options="allNames" md-dense></md-autocomplete>
                </div>
            </template>
		</md-card-content>
		<md-card-actions>
            <md-button v-if="item.cnt < 1000" @click="merge(item._id)">Слить</md-button>
            <md-button @click="edit()" v-show="!item.edited">Редактировать</md-button>
			<md-button @click="save()" v-show="item.edited">Сохранить</md-button>
		</md-card-actions>
	</md-card>
</template>
<style lang="less">
.comp-card {
    width: 280px;    
    display: inline-block;
    padding: 6px;
    margin: 6px;

    .messages {
        background-color:#f0f0f0;
        padding: 6px;
        border: 1px solid #f0f0f0;
        border-radius: 4px;
        margin-bottom: 16px;

        button {
            position:relative;
            top: -6px;
            left: 12px;
        }
    }
}
 
.icon-man {
    color: blue !important;
    position:relative;
    top: -2px;
}   

.icon-woman {
    color:pink !important;
    position:relative;
    top: -2px;
}

.icon-unknown {
    color:gray !important;
    position:relative;
    top: -2px;
}

.tar {
    text-align: right;
}
</style>