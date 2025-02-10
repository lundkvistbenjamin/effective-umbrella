const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authorize = require('../middleware/auth'); // Import authentication middleware

const router = express.Router();
const prisma = new PrismaClient();

// Get all products (Protected)
router.get('/', authorize, async (req, res) => {
    try {
        const products = await prisma.products.findMany();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Put och update när vi har auth

module.exports = router;