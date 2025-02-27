require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ message: "Ingen token!" });
        }

        console.log(`Authorize jwt: ${authHeader}`);
        const token = authHeader.split(" ")[1]; // Extrahera token

        // Verifiera JWT
        const userData = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`Token godkänd för användare ${userData.sub} ${userData.name}`);

        // Lägg till token till userData
        req.userData = { ...userData, token };

        // Kolla admin rollen
        if (userData.role !== "admin") {
            return res.status(403).json({ message: "Du har inte tillgång. Endast admins!" });
        }

        console.log("Inside middleware, token: " + req.userData.token);
        next();

    } catch (error) {
        console.log(error.message);
        res.status(401).send({
            message: "Token inte godkänd!",
            error: error.message
        });
    }
};