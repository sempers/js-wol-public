const params = document.body.getAttribute("serverparams").split(";");

export default {
    fbApiKey: params[0],
    name: params[1] || "alex",
    modules: params[2].split(",") || "wol",    
    useLocalServer: Boolean(params[3]) || true,    
    baseUrl: params[4] || "",
    thousand: " ",
    decimal: ","  
};