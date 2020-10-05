const _mysql = require("mysql")
const XLSX = require("xlsx")
const Debug = require("./debug")
const {
    _MyCoords,
    _UserNameList,
    _DefaultLinksList,
    _FianlList,
} = require("./global")

const Mysql = function () {
    Debug.log(["Mysql: open database."])
}

// For heroku
const host = "mysql.vps100658.mylogin.co"
const user = "eimajjjj_vvland"
const password = "Jamiejam1!"
const dbName = "eimajjjj_vvland"

// For local testing
// const host = "localhost"
// const user = "root"
// const password = ""
// const dbName = "gridmap"

const coordsTable = _mysql.escapeId(dbName + ".coords")
const finalTable = _mysql.escapeId(dbName + ".final")
const userTable = _mysql.escapeId(dbName + ".user")
const linksTable = _mysql.escapeId(dbName + ".links")

var db_config = {
    host: host,
    // port: 3306,
    user: user,
    password: password,
    database: dbName,
}
var connection
var today = new Date().toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
})
var userNameList = []

handleDisconnect()
// Initialize Mysql (migaration and load saved data)
Mysql.init = async (DEFAULT_PATH) => {
    Debug.log(["Mysql: initialize.", host])

    userNameList = await Mysql.handleUserNameList(DEFAULT_PATH)
    await Mysql.migration()
}

Mysql.connectionHandle = () => {
    connection = _mysql.createConnection(db_config)

    connection.connect(function (err) {
        if (err) throw err
        console.log("MySQL Connected!")
    })
}

function handleDisconnect() {
    connection = _mysql.createConnection(db_config)
    // connection.autocommit = 1
    // Recreate the connection, since
    // the old one cannot be reused.

    connection.connect(function (err) {
        // The server is either down
        if (err) {
            // or restarting (takes a while sometimes).
            console.log("error when connecting to db:", err)
            // Mysql.hadnleConnectionClose()
            connection.end()
            setTimeout(handleDisconnect, 2000) // We introduce a delay before attempting to reconnect,
        } // to avoid a hot loop, and to allow our node script to
    }) // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on("error", function (err) {
        console.log("db error", err)
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            // Connection to the MySQL server is usually
            // Mysql.hadnleConnectionClose()
            connection.end()
            handleDisconnect() // lost due to either server restart, or a
        } else {
            // connnection idle timeout (the wait_timeout
            throw err // server variable configures this)
        }
    })
}

function checkExcelFile(fileName) {
    var workbook
    try {
        workbook = XLSX.readFile(fileName)
    } catch (err) {
        console.log(err)
        return []
    }
    var sheet_name_list = workbook.SheetNames
    var data = []

    sheet_name_list.forEach(function (y) {
        var worksheet = workbook.Sheets[y]
        var headers = {}
        for (z in worksheet) {
            if (z[0] === "!") continue
            //parse out the column, row, and value
            var tt = 0
            for (var i = 0; i < z.length; i++) {
                if (!isNaN(z[i])) {
                    tt = i
                    break
                }
            }
            var col = z.substring(0, tt)
            var row = parseInt(z.substring(tt))
            var value = worksheet[z].v

            //store header names
            if (row == 1 && value) {
                headers[col] = value
                continue
            }

            if (!data[row]) data[row] = {}
            data[row][headers[col]] = value
        }
        //drop those first two rows which are empty
        data.shift()
        data.shift()
    })

    return data
}

Mysql.handleUserNameList = (DEFAULT_PATH) => {
    const fileName = DEFAULT_PATH + "/docs/username.xlsx"
    return checkExcelFile(fileName)
}

// Migration Mysql. Function to create data table if it is not exists.
Mysql.migration = async () => {
    Debug.log(["Mysql: execute migration."])

    await Mysql.createDatabase()
    await connection.query(`USE ${dbName}`)
    await Mysql.createCoordsTable()
    await Mysql.createFinalTable()
    await Mysql.createUserTable()
    await Mysql.createLinksTable()
    await Mysql.saveUserNameList(userNameList)
    await Mysql.getUserNameList()
    await Mysql.saveFinalList()
    await Mysql.getFinalList()
    await Mysql.saveDefaultLinks()
    await Mysql.getDefaultLinks()
    await Mysql.getExistingCoords()
}

Mysql.createDatabase = () => {
    connection.query("CREATE DATABASE IF NOT EXISTS ??", dbName, function (
        err,
        results
    ) {
        if (err)
            return Debug.err(["Mysql: Error in creating database", err.message])

        Debug.log(["Database created!", dbName])
    })
}

Mysql.createCoordsTable = () => {
    // User Table
    const createCoordsTable = `CREATE TABLE IF NOT EXISTS ${coordsTable}(
        \`id\` INT primary key AUTO_INCREMENT,
        \`index\` INT(9) NOT NULL,
        \`coords\` VARCHAR(255) NOT NULL,
        \`userName\` VARCHAR(255) NOT NULL,
        \`transactionId\` VARCHAR(255) NOT NULL,
        \`walletaddr\` VARCHAR(255) NOT NULL,
        \`today\` VARCHAR(255) NOT NULL,
        UNIQUE INDEX (\`index\`)
    )`

    connection.query(createCoordsTable, function (err) {
        if (err)
            return Debug.err([
                `Mysql: Error in creating ${coordsTable} table`,
                err.message,
            ])

        Debug.log(["Table created!", coordsTable])
    })
}

Mysql.createFinalTable = () => {
    // User Table
    const createFinalTable = `CREATE TABLE IF NOT EXISTS ${finalTable}(
        \`id\` INT primary key AUTO_INCREMENT,
        \`packcost\` VARCHAR(255) NOT NULL,
        \`desc1\` TEXT NOT NULL,
        \`vetDesc\` VARCHAR(255) NOT NULL,
        \`vetRate\` DOUBLE NOT NULL,
        \`address1\` VARCHAR(255) NOT NULL,
        \`usdtDesc\` VARCHAR(255) NOT NULL,
        \`usdtRate\` DOUBLE NOT NULL,
        \`address2\` VARCHAR(255) NOT NULL,
        \`ethDesc\` VARCHAR(255) NOT NULL,
        \`ethRate\` DOUBLE NOT NULL,
        \`address3\` VARCHAR(255) NOT NULL,
        \`desc2\` TEXT NOT NULL,
        \`duplicate\` TINYINT(1) NOT NULL COMMENT 'Prevent for the second insert',
        UNIQUE INDEX (duplicate)
    )`

    connection.query(createFinalTable, function (err) {
        if (err)
            return Debug.err([
                `Mysql: Error in creating ${finalTable} table`,
                err.message,
            ])

        Debug.log(["Table created!", finalTable])
    })
}

Mysql.createUserTable = () => {
    // User Table
    const createUserTable = `CREATE TABLE IF NOT EXISTS ${userTable}(
        \`id\` INT primary key AUTO_INCREMENT,
        \`userName\` VARCHAR(255) NOT NULL,
        \`discount\` VARCHAR(255) NOT NULL,
        \`userType\` TINYINT(1) NOT NULL DEFAULT '1' COMMENT '1: registeredUser, 2: unRegisteredUser',
        UNIQUE INDEX (userName)
    )`

    connection.query(createUserTable, function (err) {
        if (err)
            return Debug.err([
                `Mysql: Error in creating ${userTable} table`,
                err.message,
            ])

        Debug.log(["Table created!", userTable])
    })
}

Mysql.createLinksTable = () => {
    // User Table
    const createLinksTable = `CREATE TABLE IF NOT EXISTS ${linksTable}(
        \`id\` INT primary key AUTO_INCREMENT,
        \`userType\` TINYINT(1) NOT NULL COMMENT '1: registeredUser, 2: unRegisteredUser',
        \`link\` VARCHAR(255) NOT NULL DEFAULT 'testlink',
        \`allow\` TINYINT(1) NOT NULL COMMENT '1: allow, 2: disAllow',
        \`today\` VARCHAR(255) NOT NULL,
        UNIQUE INDEX (userType)
    )`

    connection.query(createLinksTable, function (err) {
        if (err)
            return Debug.err([
                `Mysql: Error in creating ${linksTable} table`,
                err.message,
            ])

        Debug.log(["Table created!", linksTable])
    })
}

Mysql.getExistingCoords = () => {
    const sql = `SELECT * FROM ${coordsTable}`
    connection.query(sql, function (err, result) {
        if (err) {
            return Debug.err(["Mysql Error in coordsTable: ", err.message])
        }

        if (result.length === 0) _MyCoords.coord = []

        if (result.length > 0) {
            _MyCoords.coord = result
            Debug.log(["Success in getting coordsTable: "])
        } else {
            Debug.log(["Failed in getting coordsTable: "])
        }
    })
}

Mysql.getUserNameList = () => {
    const sql = `SELECT * FROM ${userTable}`
    connection.query(sql, function (err, result) {
        if (err) return Debug.err(["Mysql Error in userTable: ", err.message])

        if (result.length === 0) _UserNameList.list = []

        if (result.length > 0) {
            _UserNameList.list = result
            Debug.log(["Success in getting userTable: "])
        } else {
            Debug.log(["Failed in getting userTable: "])
        }
    })
}

Mysql.getDefaultLinks = () => {
    const sql = `SELECT * FROM ${linksTable}`
    connection.query(sql, function (err, result) {
        if (err) return Debug.err(["Mysql Error in linksTable: ", err.message])

        if (result.length === 0) _DefaultLinksList.list = []

        if (result.length > 0) {
            _DefaultLinksList.list = result
            Debug.log(["Success in getting linksTable: "])
        } else {
            Debug.log(["Failed in getting linksTable: "])
        }
    })
}

Mysql.getFinalList = () => {
    const sql = `SELECT * FROM ${finalTable}`
    connection.query(sql, function (err, result) {
        if (err) return Debug.err(["Mysql Error in finalTable: ", err.message])

        if (result.length === 0) _FianlList.list = []

        if (result.length > 0) {
            _FianlList.list = result
            Debug.log(["Success in getting finalTable: "])
        } else {
            Debug.log(["Failed in getting finalTable: "])
        }
    })
}

Mysql.saveCoords = (obj) => {
    const sql = `INSERT INTO ${coordsTable} (\`index\`, \`coords\`, \`userName\`, \`transactionId\`, \`walletaddr\`, \`today\`) VALUES ?`

    var records = obj.coords.map((coord, key) => [
        obj.indexs[key],
        coord.toString(),
        obj.userName,
        obj.transactionId,
        obj.walletaddr,
        today
    ])

    connection.query(sql, [records], function (err, results) {
        if (err) {
            Debug.err(["Mysql Error in saveCoords: ", err.message])
            return false
        }

        Debug.log(["New Coords created: "])
        return true
    })
}

Mysql.saveUserNameList = (obj) => {
    var sql = `INSERT INTO ${userTable} (userName, discount, userType) VALUES ?`

    var records = obj.map((user) => [
        user["Please enter your node address"],
        user["Discount"],
        user.hasOwnProperty("userType") ? user["userType"] : 1,
    ])

    connection.query(sql, [records], function (err, result) {
        if (err) {
            return Debug.err(["Mysql Error in saveUserNameList: ", err.message])
        }

        Debug.log(["New userNameList created: "])
    })
}

Mysql.saveDefaultLinks = () => {
    var records = [
        [1, "https://localhost/testmap", 1, today],
        [2, "https://localhost/testmap", 2, today],
    ]

    var sql = `INSERT INTO ${linksTable} (\`userType\`, \`link\`, \`allow\`, \`today\`) VALUES ?`

    connection.query(sql, [records], function (err, result) {
        if (err) {
            return Debug.err(["Mysql Error in saveDefaultLinks: ", err.message])
        }

        Debug.log(["New defaultLinksData created: "])
    })
}

Mysql.saveFinalList = () => {
    var records = [
        [
            'Your land pack costs',
            'You have 30 minutes to complete your order. If no payment has been made your land will go back on sale and address blacklisted.',
            'For VET, please send',
            0.9,
            'John Smith',
            'For USDT please send',
            1.0,
            'James Bridon',
            'For Eth please send',
            0.8,
            'Max Halton',
            'For PayPal please enter your email address in Transaction ID. You will receive your land NFTs within 4 days to your associated VET address.',
            1
        ],
    ]

    var sql = `INSERT INTO ${finalTable} (\`packcost\`, \`desc1\`, \`vetDesc\`, \`vetRate\`, \`address1\`, \`usdtDesc\`, \`usdtRate\`, \`address2\`, \`ethDesc\`, \`ethRate\`, \`address3\`, \`desc2\`, \`duplicate\`) VALUES ?`

    connection.query(sql, [records], function (err, result) {
        if (err) {
            return Debug.err(["Mysql Error in saveFinalList: ", err.message])
        }

        Debug.log(["New FinalList created: "])
    })
}

module.exports = Mysql
