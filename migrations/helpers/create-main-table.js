module.exports = `
CREATE TABLE main_table_js (
    id SERIAL PRIMARY KEY,
    name_var VARCHAR(50)
);

INSERT INTO main_table_js(name_var) VALUES ('Person_One');
`
