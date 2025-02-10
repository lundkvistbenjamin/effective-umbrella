const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

console.log(`Node.js ${process.version}`);

app.use(cors({
    origin: [
        "http://127.0.0.1:5500"
    ]
}));

app.get("/", (req, res) => {
    console.log(req.myVar);
    res.send("<h1>Hello!!!</h1>");
});

app.use(express.json());

// Import the products route
const productsRouter = require('./routes/products');
app.use('/products', productsRouter);

app.listen(PORT, () => {
    try {
        console.log(`Running on http://localhost:${PORT}`);
    } catch (error) {
        console.error(error);
    }
});