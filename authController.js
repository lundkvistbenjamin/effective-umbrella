require("dotenv").config();
const jwt = require("jsonwebtoken");

// Function to generate a JWT
function generateToken(userId) {
    return jwt.sign(
        { sub: userId },
        process.env.JWT_SECRET,
        { expiresIn: "60d" }
    );
}

// Example
const testToken = generateToken(1);
console.log(`Generated JWT: ${testToken}`);
