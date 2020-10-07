module.exports = `
CREATE TABLE users
(
    user_id SERIAL PRIMARY KEY,
    user_name character varying(45)NOT NULL,
    user_ip_address inet,
    user_type user_role,
    user_email character varying(100)
);
SET timezone = 'US/Eastern';
`
