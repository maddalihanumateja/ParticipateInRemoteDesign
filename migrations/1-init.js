const createRoleEnum = require("./helpers/create-role-enum");
const createMeetingLogsTable = require("./helpers/create-meeting-logs-table");
const insertTestData = require("./helpers/insert-test-data");

module.exports.generateSql = () => `${createRoleEnum} 
${createMeetingLogsTable} 
${insertTestData}`