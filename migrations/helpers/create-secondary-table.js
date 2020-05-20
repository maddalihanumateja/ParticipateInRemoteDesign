module.exports = `
CREATE TABLE secondary_table_js (
    id SERIAL PRIMARY KEY,
    name_secondary VARCHAR(50)
);

INSERT INTO secondary_table_js(name_secondary) VALUES ('Person_One_Secondary');

`
