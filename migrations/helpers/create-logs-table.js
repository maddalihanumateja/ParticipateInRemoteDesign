module.exports = `
CREATE TABLE logs
(
    log_id SERIAL PRIMARY KEY,
    meeting_id integer NOT NULL,
    user_id integer NOT NULL,
    meeting_host boolean,
    meeting_join_time timestamp with time zone,
    meeting_leave_time timestamp with time zone
);
SET timezone = 'US/Eastern';
`
