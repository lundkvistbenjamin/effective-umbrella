const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authorize = require('../middleware/auth'); // Import JWT auth middleware

const router = express.Router();
const prisma = new PrismaClient();

// Get all products (Public)
router.get('/', async (req, res) => {
    try {
        const products = await prisma.products.findMany();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single product by ID (Public)
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

// Create a new product (Protected)
router.post('/', authorize, async (req, res) => {
    try {
        const { sku, name, price, description, image } = req.body;
        const product = await prisma.products.create({
            data: {
                sku,
                name,
                price,
                description,
                image,
            },
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a product by ID (Protected)
router.put('/:id', authorize, async (req, res) => {
    try {
        const { sku, name, price, description, image } = req.body;
        const product = await prisma.products.update({
            where: { id: parseInt(req.params.id) },
            data: {
                sku,
                name,
                price,
                description,
                image,
                updated_at: new Date(),
            },
        });
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a product by ID (Protected)
router.delete('/:id', authorize, async (req, res) => {
    try {
        await prisma.products.delete({
            where: { id: parseInt(req.params.id) },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
