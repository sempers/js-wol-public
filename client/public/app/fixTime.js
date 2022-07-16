var t0 = (new Date()).getTime();
FIX_TIME("START LOADING SCRIPTS");

function FIX_TIME(msg) {
    console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + msg);
}

function LOG(fname, msg) {
    console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + `%c[${fname}]%c ${msg}`, 'background-color:green;color:white', 'background-color:white;color:black');
}

function ERROR(fname, msg, ex) {
    console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + `%c[${fname}]%c ${msg}`, "background-color:red;color:white;", 'background-color:white;color:black') + (ex ? console.dir(ex): "");
}