const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

console.log(`Node.js ${process.version}`);

app.use(cors({
    origin: process.env.MODE === "development"
        ? "*"
        : "https://effective-umbrella-cna-product-service.2.rahtiapp.fi"
}));

app.use(express.json());

// Import the products route
const productsRouter = require('./routes/products');
app.use('/products', productsRouter);

app.get('/', (req, res) => {
    res.json({ msg: "Hej Kevin" });
});

app.listen(PORT, () => {
    try {
        console.log(`Running on http://localhost:${PORT}`);
    } catch (error) {
        console.error(error);
    }
});

//testing