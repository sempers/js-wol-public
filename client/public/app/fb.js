let fb = {
	app: firebase.initializeApp({
		apiKey: "",
		authDomain: "vwol-d6f21.firebaseapp.com",
		databaseURL: "https://vwol-d6f21.firebaseio.com",
		projectId: "vwol-d6f21",
		storageBucket: "vwol-d6f21.appspot.com",
		messagingSenderId: "1085346704805"
	}),

	auth(continueLoading, backView) {
		this.app.auth().onAuthStateChanged((user) => {
			if (user) {
				LOG('AUTH', `User ${user.email} is already authenticated, last logged in at ${(new Date(+user.toJSON().lastLoginAt)).toString()}`);
				continueLoading();
			} else {
				LOG('AUTH', 'User not authenticated');
				if (window.location.pathname !== "/login") {
					if (!backView)
						window.location.replace('/login');	//Перенаправление
					else
						window.location.replace("/login?back=" + backView) //Перенаправление с бэком
				}
			}
		});
	},

	authenticate(email, password) {
		return this.app.auth().signInWithEmailAndPassword(email, password);
	},

	logout(backView) {
		this.app.auth().signOut().then(function () {
			window.location.replace("/login" + (backView ? back="+backView" : ""));
		});
	}
};