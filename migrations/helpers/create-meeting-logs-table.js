module.exports = `
CREATE TABLE meeting_logs(
    meeting_id SERIAL PRIMARY KEY,
    meeting_number BIGINT NOT NULL,
    meeting_password VARCHAR(10),
    user_name VARCHAR(45) NOT NULL,
    email VARCHAR(100),
    ip_address inet,
    meeting_join_time timestamptz,
    meeting_leave_time timestamptz,
    user_type user_role,
    meeting_host BOOLEAN NOT NULL,
    meeting_ended BOOLEAN NOT NULL
);
SET timezone = 'US/Eastern';
`