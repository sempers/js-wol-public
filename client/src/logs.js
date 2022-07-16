const t0 = window.t0;

export function FIX_TIME(msg) {
    console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + msg);
}

export function LOG(fname, msg, show) {
    console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + `%c[${fname}]%c ${msg}`, 'background-color:green;color:white', 'background-color:white;color:black');
    if (show)
    {
        toastr.success(`[${ fname ? fname: ""}]: ${msg}`);
    }
}

export function ERROR(fname, msg, ex, show) {
    console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + `%c[${fname}]%c ${msg}`, "background-color:red;color:white;", 'background-color:white;color:black');
    if (ex)
        console.dir(ex);
    if (show) {
        toastr.error(`[${ fname ? fname: ""}]: ${msg}`);
    }
}