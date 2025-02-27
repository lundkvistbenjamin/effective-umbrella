require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ message: "Ingen token!" });
        }

        console.log(`authorize jwt: ${authHeader}`);
        const token = authHeader?.split(" ")[1];

        // Verifiera JWT
        const userData = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`Token goodkänd för användare ${userData.sub} ${userData.name}`);

        // Kolla om user är admin
        if (userData.role !== "admin") {
            return res.status(403).json({ message: "Du har inte tillgång. Endast admins!" });
        }

        // Annars returnar vi de
        req.userData = userData;
        next();

    } catch (error) {
        console.log(error.message);

        res.status(401).send({
            message: "Authorization error",
            error: error.message
        });
    }
};