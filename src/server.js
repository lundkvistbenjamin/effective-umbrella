const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Use CORS to allow all origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Serve uploaded images as static files
app.use('/uploads', express.static('/app/uploads'));

// Example route
app.get("/", (req, res) => {
    res.send("<h1>Hello!!!</h1>");
});

// Import the products route
const productsRouter = require('./routes/products');
app.use('/products', productsRouter);

// Start the server
app.listen(PORT, () => {
    try {
        console.log(`Server is running on http://localhost:${PORT}`);
    } catch (error) {
        console.error(error);
    }
});
