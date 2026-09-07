const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getUsers, saveUsers } = require("../services/userService");

exports.register = async (req, res) => {

    const { name, email, password, role } = req.body;

    const users = getUsers();

    const exists = users.find(u => u.email === email);

    if (exists) {
        return res.status(409).json({
            success: false,
            message: "User already exists"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = {
        id: Date.now().toString(),
        name,
        email,
        role,
        password: hashedPassword
    };

    users.push(user);

    saveUsers(users);

    res.status(201).json({
        success: true,
        message: "Registration successful"
    });

};

exports.login = async (req, res) => {

    const { email, password } = req.body;

    const users = getUsers();

    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }

    const token = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    res.json({
        success: true,
        token
    });

};