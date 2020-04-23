CREATE TYPE user_role AS ENUM ('researcher', 'participant');

CREATE TABLE meeting_logs(
    meeting_id SERIAL PRIMARY KEY,
    meeting_number INT NOT NULL,
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

ALTER TABLE meeting_logs ALTER COLUMN meeting_number TYPE BIGINT;

INSERT INTO meeting_logs(meeting_number, meeting_password,  user_name, email, ip_address, meeting_join_time,    meeting_leave_time, user_type, meeting_host, meeting_ended) VALUES (1122442342, '019233', 'test_user', NULL, '192.168.0.1/24', '2020-03-18 06:05:06 US/Eastern','2020-03-18 06:35:06 US/Eastern','researcher',true,true);