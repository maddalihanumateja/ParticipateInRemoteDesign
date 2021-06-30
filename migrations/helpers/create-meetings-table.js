module.exports = `
CREATE TABLE meetings
(
    meeting_id SERIAL PRIMARY KEY,
    meeting_number character varying(40),
    meeting_password character varying(10),
    meeting_ended boolean NOT NULL
);
SET timezone = 'US/Eastern';
`
