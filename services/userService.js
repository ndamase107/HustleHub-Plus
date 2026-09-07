const fs = require("fs");

const file = "./storage/users.json";

const getUsers = () => {
    return JSON.parse(fs.readFileSync(file));
};

const saveUsers = users => {
    fs.writeFileSync(file, JSON.stringify(users, null, 2));
};

module.exports = {
    getUsers,
    saveUsers
};