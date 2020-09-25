const _mysql = require("mysql")
const Debug = require("./debug")
const { _MyCoords } = require("./global")

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

var db_config = {
    host: host,
    // port: 3306,
    user: user,
    password: password,
    database: dbName,
}
var connection

handleDisconnect()
// Initialize Mysql (migaration and load saved data)
Mysql.init = async () => {
    Debug.log(["Mysql: initialize.", host])
    // await Mysql.hadnleConnectionClose()
    // await Mysql.connectionHandle()
    await Mysql.migration()
}

Mysql.connectionHandle = () => {
    connection = _mysql.createConnection(db_config);

    connection.connect(function(err) {
        if (err) throw err;
        console.log("MySQL Connected!");
    });
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
            connection.end();
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        } // to avoid a hot loop, and to allow our node script to
    }) // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on("error", function (err) {
        console.log("db error", err)
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            // Connection to the MySQL server is usually
            // Mysql.hadnleConnectionClose()
            connection.end();
            handleDisconnect() // lost due to either server restart, or a
        } else {
            // connnection idle timeout (the wait_timeout
            throw err // server variable configures this)
        }
    })
}

Mysql.hadnleConnectionClose = () => {
    if (connection)
        connection.end();
}
// Migration Mysql. Function to create data table if it is not exists.
Mysql.migration = async () => {
    Debug.log(["Mysql: execute migration."])

    await Mysql.createDatabase()
    await connection.query(`USE ${dbName}`)
    await Mysql.createCoordsTable()
    await Mysql.createFinalTable()
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
        \`userName\` VARCHAR(255) NOT NULL
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
        \`userName\` VARCHAR(255) NOT NULL,
        \`transactionId\` VARCHAR(255) NOT NULL,
        \`walletaddr\` VARCHAR(255) NOT NULL,
        \`today\` VARCHAR(255) NOT NULL,
        \`coords\` TEXT NOT NULL
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

Mysql.getExistingCoords = () => {
    const sql = `SELECT * FROM ${coordsTable}`
    connection.query(sql, function (err, result) {
        if (err)
            return Debug.err([
                "Mysql Error in getExistingCoords: ",
                err.message,
            ])
        if (result.length > 0) {
            _MyCoords.coord = result
            Debug.log(["Success in getting Coords: "])
        } else {
            Debug.log(["Failed in getting Coords: "])
        }
    })
}

Mysql.saveCoords = (obj) => {
    // Checking the Indexs of email & nickName
    const sql = `INSERT INTO ${coordsTable} (\`index\`, \`coords\`, \`userName\`)
        VALUES(${obj.index}, '${obj.coords}', '${obj.userName}')`

    connection.query(sql, function (err, results) {
        if (err) {
            Debug.err(["Mysql Error in saveCoords: ", err.message])
        }

        Debug.log(["New Coords created: "])
    })
    // await Mysql.getExistingCoords()
}

Mysql.saveFinalData = (obj) => {
    const sql = `INSERT INTO ${finalTable} (\`userName\`, \`transactionId\`, \`walletaddr\`, \`today\`, \`coords\`)
        VALUES('${obj.userName}', '${obj.transactionId}', '${obj.walletaddr}', '${obj.today}', '${obj.coords.join('\t')}')`

    connection.query(sql, function (err, results) {
        if (err) {
            Debug.err(["Mysql Error in saveFinalData: ", err.message])
        }

        Debug.log(["New FinalData created: "])
    })
}

module.exports = Mysql
