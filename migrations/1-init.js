const createRoleEnum = require("./helpers/create-role-enum");
const createRoleEnum = require("./helpers/create-meetings-table");
const createRoleEnum = require("./helpers/create-logs-table");
const createRoleEnum = require("./helpers/create-users-table");
// const createMeetingLogsTable = require("./helpers/create-meeting-logs-table");
// const insertTestData = require("./helpers/insert-test-data");

module.exports.generateSql = () => `${createRoleEnum}
${createMeetingLogsTable}
${insertTestData}`
