const { MODE } = require('./global')
const Debug = function () {
    console.log('Debug MODE.')
}

Debug.log = (params) => {
    if (MODE === "DEBUG") {
        var infoLog = ""
        Array.prototype.forEach.call(params, (element) => {
            infoLog += element + "\t"
        })
        console.log(infoLog)
    }
}

Debug.err = (params) => {
    if (MODE === "DEBUG") {
        var errLog = ""
        Array.prototype.forEach.call(params, (element) => {
            errLog += element + "\t"
        })
        console.log(errLog)
    }
}

module.exports = Debug;
