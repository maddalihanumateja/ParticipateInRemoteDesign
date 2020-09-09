CREATE TYPE user_role AS ENUM ('researcher', 'participant');

CREATE TABLE logs
(
    log_id SERIAL PRIMARY KEY,
    meeting_id integer NOT NULL,
    user_id integer NOT NULL,
    meeting_host boolean,
    meeting_join_time timestamp with time zone,
    meeting_leave_time timestamp with time zone
);

CREATE TABLE meetings
(
    meeting_id SERIAL PRIMARY KEY,
    meeting_number bigint NOT NULL,
    meeting_password character varying(10),
    meeting_ended boolean NOT NULL
);

CREATE TABLE users
(
    user_id SERIAL PRIMARY KEY,
    user_name character varying(45)NOT NULL,
    user_ip_address inet,
    user_type user_role,
    user_email character varying(100)
);

SET timezone = 'US/Eastern';
