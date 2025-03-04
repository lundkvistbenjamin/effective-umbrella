const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authorizeAdmin = require("../middleware/authAdmin");
const upload = require("../middleware/upload");
const generateSKU = require("../middleware/generateSKU");
const { fetchAllInventory, fetchInventoryBySKU, fetchInventoryBatch, createInventory, deleteInventory } = require("../services/inventory");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Beer product management
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get("/", async (req, res) => {
    try {
        // Hämta produkter från databasen
        const products = await prisma.products.findMany();

        // Hämta saldo från inventory-service
        const inventoryData = await fetchAllInventory();

        // Kombinera produkter med saldo
        const productsWithInventory = products.map(product => {
            const inventory = inventoryData.find(item => item.productCode === product.sku);
            return { ...product, stock: inventory ? inventory.stock : 0 };
        });

        res.status(200).json({ msg: "Produkter hämtades.", products: productsWithInventory });
    } catch (error) {
        res.status(500).json({ msg: "Fel vid hämtning av produkter.", error: error.message });
    }
});

/**
 * @swagger
 * /products/{sku}:
 *   get:
 *     summary: Get a specific product by SKU
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sku
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get("/:sku", async (req, res) => {
    try {
        const { sku } = req.params;
        // Hämta produkter från databasen med SKU
        const product = await prisma.products.findUnique({ where: { sku } });

        // Kolla om produkten inte finns, ge error
        if (!product) {
            return res.status(404).json({ msg: "Produkten hittades inte." });
        }

        // Hämta saldo från inventory-service med SKU
        const inventoryData = await fetchInventoryBatch([sku]);
        const inventory = inventoryData.find(item => item.productCode === sku);

        res.status(200).json({ msg: "Produkt hämtades.", product: { ...product, stock: inventory ? inventory.stock : 0 } });
    } catch (error) {
        res.status(500).json({ msg: "Fel vid hämtning av produkt.", error: error.message });
    }
});

/**
 * @swagger
 * /products/batch:
 *   post:
 *     summary: Get multiple products by a list of SKUs
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchRequest'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid request. Missing or incorrect product codes.
 *       500:
 *         description: Error fetching products.
 */
router.post("/batch", async (req, res) => {
    try {
        const { product_codes } = req.body;

        // Kolla om product_codes är en array, eller om den finns
        if (!Array.isArray(product_codes) || product_codes.length === 0) {
            return res.status(400).json({ error: "Skicka en array med produktkoder." });
        }

        // Hämta produkter från databasen med SKU array
        const products = await prisma.products.findMany({
            where: { sku: { in: product_codes } }
        });

        // Hämta saldo från inventory-service med SKU array
        const inventoryData = await fetchInventoryBatch(product_codes);

        // Kombinera produkter med saldo
        const productsWithInventory = products.map(product => {
            const inventory = inventoryData.find(item => item.productCode === product.sku);
            return { ...product, stock: inventory ? inventory.stock : 0 };
        });

        res.status(200).json({ msg: "Produkter hämtades.", products: productsWithInventory });
    } catch (error) {
        res.status(500).json({ error: "Fel vid hämtning av produkter eller lagerdata." });
    }
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Add a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProduct'
 *     responses:
 *       201:
 *         description: Product created
 */
router.post("/", authorizeAdmin, upload.single("image"), generateSKU(prisma), async (req, res) => {
    try {
        const { name, price, description, country, category, stock, sku } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        // Kolla om användaren angett giltig stock nummer
        if (!stock) {
            return res.status(400).json({ msg: "Ange saldo." });
        }

        // Skapa inventory data
        const inventoryData = [{ productCode: sku, stock }];

        // Skicka produktdata till databasen
        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.products.create({
                data: { sku, name, price, description, image: imagePath, country, category }
            });

            // Skicka inventorydata till inventory-service
            await createInventory(req.userData.token, inventoryData);

            return product;
        });

        res.status(201).json({ msg: "Ny produkt skapades!", product: result });

    } catch (error) {
        res.status(400).json({ msg: "Fel vid skapande av produkt.", error: error.message });
    }
});

/**
 * @swagger
 * /products/{sku}:
 *   put:
 *     summary: Update a product by SKU
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sku
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProduct'
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put("/:sku", authorizeAdmin, upload.single("image"), async (req, res) => {
    try {
        const { name, price, description } = req.body;
        const data = { updated_at: new Date() };

        // Uppdatera endast datan som användaren angett
        if (name?.trim()) data.name = name;
        if (!isNaN(price)) data.price = parseFloat(price).toFixed(2);
        if (description?.trim()) data.description = description;
        if (req.file) data.image = `/uploads/${req.file.filename}`;

        // Uppdatera produkten i databasen
        const product = await prisma.products.update({
            where: { sku: req.params.sku },
            data,
        });

        res.status(200).json({ msg: "Produkten uppdaterades.", product });
    } catch (error) {
        res.status(400).json({ msg: "Fel vid uppdatering av produkt.", error: error.message });
    }
});

/**
 * @swagger
 * /products/{sku}:
 *   delete:
 *     summary: Delete a product by SKU
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sku
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted
 */
router.delete("/:sku", authorizeAdmin, async (req, res) => {
    try {
        const { sku } = req.params;

        // Ta bort produkten från databasen och inventory-service
        await prisma.$transaction(async (tx) => {
            await tx.products.delete({ where: { sku } });
            await deleteInventory(req.userData.token, [{ productCode: sku }]);
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ msg: "Fel vid borttagning av produkt.", error: error.message });
    }
});

module.exports = router;