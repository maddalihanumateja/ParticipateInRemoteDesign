module.exports = `
CREATE TABLE meetings
(
    meeting_id SERIAL PRIMARY KEY,
    meeting_number bigint NOT NULL,
    meeting_password character varying(10),
    meeting_ended boolean NOT NULL
);
SET timezone = 'US/Eastern';
`
