if(global.Proxy){
    module.exports = require("./lib/Class.js")
}else{
    throw new Error("Please use 'node --harmony-proxy' to enable the Proxy Feature.")
}