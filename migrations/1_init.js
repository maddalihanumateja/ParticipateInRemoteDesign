const createRoleEnum = require("./helpers/create-role-enum");
const createMeetingsTable = require("./helpers/create-meetings-table");
const createMeetingLogsTable = require("./helpers/create-logs-table");
const createUsersTable = require("./helpers/create-users-table");
// const createMeetingLogsTable = require("./helpers/create-meeting-logs-table");
// const insertTestData = require("./helpers/insert-test-data");

module.exports.generateSql = () => `${createRoleEnum}
${createMeetingLogsTable}
${createMeetingsTable}
${createUsersTable}`
