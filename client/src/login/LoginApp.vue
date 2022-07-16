<script>
import { authEmailPassword } from "../fb.js"

export default {
    data() {
        return {
            email: "",
            password: "",
            invalidData: false
        }
    },

    methods: {
        async onLoginClick() {
            try {
                await authEmailPassword(this.email, this.password);
                this.email = "";
                this.password = "";
                this.$router.push({name: "wol"});
            } catch (e) {
                this.invalidData = true;
            } finally {
                
            }
        }
    }
}
</script>
<template>
    <div style="display:flex;position:absolute;width:100%;height:80%;align-items:center;justify-content:center">
        <div style="width:300px;height:200px">
            <div style="display:flex;justify-content:center;width:100%">
                <div>
                    <h1 style="font-family: Dosis, 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;font-size: 24px;">Weeks of Life</h1>
                </div>
            </div>
            <md-field md-clearable>
                <label>Email:</label>
                <md-input v-model="email" placeholder="Email"></md-input>
            </md-field>
            <md-field>
                <label>Password:</label>
                <md-input v-model="password" type="password" placeholder="Password" @keyup.enter="onLoginClick()">
                </md-input>
            </md-field>
            <div style="width: 100%; margin-top:20px; display:flex; align-items:center">
                <md-button class="md-raised md-primary" @click="onLoginClick()">Log In</md-button>
                <md-chip v-if="invalidData" class="md-accent" md-clickable>Invalid email or password</md-chip>
            </div>
        </div>
    </div>
</template>