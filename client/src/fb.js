import { LOG } from './logs.js'
import $config from './config.js'

const fbApp = firebase.initializeApp({
	apiKey: $config.fbApiKey,
	authDomain: "vwol-d6f21.firebaseapp.com",
	databaseURL: "https://vwol-d6f21.firebaseio.com",
	projectId: "vwol-d6f21",
	storageBucket: "vwol-d6f21.appspot.com",
	messagingSenderId: "1085346704805"
});

function authenticate(authCallback, nonAuthCallback) {
	fbApp.auth().onAuthStateChanged(user => {
		if (user) {
			LOG('AUTH', `User ${user.email} is already authenticated, last logged in at ${(new Date(+user.toJSON().lastLoginAt)).toString()}`);
			authCallback(user);
		} else {
			LOG('AUTH', 'User not authenticated');
			nonAuthCallback();
		}
	});
}

function authEmailPassword(email, password) {
	return fbApp.auth().signInWithEmailAndPassword(email, password);
}

function logout(callBack) {
	fbApp.auth().signOut().then(callBack);
}

export {
    authenticate,
    authEmailPassword,
    logout
};