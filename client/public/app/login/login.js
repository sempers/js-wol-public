let vm = new Vue({
	template: `
	<div style="display:flex;position:absolute;width:100%;height:80%;align-items:center;justify-content:center">
		<div style="width:300px;height:200px">
            <div style="display:flex;justify-content:center;width:100%">
                <div><h1 style="font-family: Dosis, 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;font-size: 24px;">Weeks of Life</h1></div>
            </div>
			<md-field md-clearable>
			  <label>Email:</label>
			  <md-input v-model="email" placeholder="Email"></md-input>
			</md-field>
			<md-field>
			  <label>Password:</label>
			  <md-input v-model="password" type="password" placeholder="Password" @keyup.enter="onLoginClick()"></md-input>
			</md-field>
			<div style="width: 100%; margin-top:20px; display:flex; align-items:center">
				<md-button class="md-raised md-primary" @click="onLoginClick()">Log In</md-button>
				<md-chip v-if="invalidData" class="md-accent" md-clickable>Invalid email or password</md-chip>
			</div>
		</div>
	</div>`,

	el: "#login",

	data() {
		return {
			email: "",
			password: "",
			invalidData: false
		}
	},	

	methods: {
		onLoginClick() {
			var self = this;
			fb.authenticate(this.email, this.password)
			.then(function() {
				let back = window.location.search.substr(1);
				let goto = back.includes('back=') && back.replace('back=','') ? "/" + back.replace('back=',''): "/";
				window.location.replace(goto); 
			}).catch(function() {
				Vue.nextTick(function() { self.invalidData = true; });
			});
		},

		onLoginClickOld() {
			try {
				fb.authenticate(this.email, this.password);
				fb.auth(function () { 
					let back = window.location.search.substr(1);
					let goto = back.includes('back=') && back.replace('back=','') ? "/" + back.replace('back=',''): "/";
					window.location.replace(goto); 
				});
			} catch (e) {
				this.invalidData = true;
			}
		}
	}
});