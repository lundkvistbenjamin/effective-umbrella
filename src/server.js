const express = require('express');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 8080;

console.log(`Node.js ${process.version}`);

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