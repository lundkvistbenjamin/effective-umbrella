const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
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

// Create a new product
router.post('/', async (req, res) => {
    try {
        const product = await prisma.product.create({
            data: req.body,
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a product by ID
router.put('/:id', async (req, res) => {
    try {
        const product = await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: req.body,
        });
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a product by ID
router.delete('/:id', async (req, res) => {
    try {
        await prisma.product.delete({
            where: { id: parseInt(req.params.id) },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;