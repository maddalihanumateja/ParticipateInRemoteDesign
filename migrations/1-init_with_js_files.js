const createMainTable = require("./helpers/create-main-table")
const createSecondaryTable = require("./helpers/create-secondary-table")
const insertVals = require("./helpers/insert_values_to_main")

module.exports.generateSql = () => `${createMainTable}
${createSecondaryTable}
${insertVals}
`
