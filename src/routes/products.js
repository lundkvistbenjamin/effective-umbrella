const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await prisma.products.findMany();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Change to SKU?
// Get a single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await prisma.products.findUnique({
            where: { id: parseInt(req.params.id) },
        });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Put och update när vi har auth

module.exports = router;