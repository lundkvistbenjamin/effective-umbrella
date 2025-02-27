const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authorizeAdmin = require("../middleware/authAdmin");
const upload = require("../middleware/upload");
const generateSKU = require("../middleware/generateSKU");

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
        const inventoryResp = await fetch("https://inventory-service-inventory-service.2.rahtiapp.fi/inventory");

        if (!inventoryResp.ok) {
            console.error("Misslyckades hämta saldo:", await inventoryResp.text());
            return res.status(500).json({ msg: "Kunde inte hämta saldo." });
        }

        const inventoryData = await inventoryResp.json();

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
        // Hämta produkt från databasen med SKU
        const product = await prisma.products.findUnique({ where: { sku } });

        if (!product) {
            return res.status(404).json({ msg: "Produkten hittades inte." });
        }

        // Hämta saldo från inventory-service med SKU
        const inventoryResp = await fetch(`https://inventory-service-inventory-service.2.rahtiapp.fi/inventory/?productCodes=${sku}`);

        if (!inventoryResp.ok) {
            console.error("Misslyckades hämta saldo:", await inventoryResp.text());
            return res.status(500).json({ msg: "Kunde inte hämta saldo." });
        }

        const inventoryData = await inventoryResp.json();
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

        if (!Array.isArray(product_codes) || product_codes.length === 0) {
            return res.status(400).json({ error: "Skicka en lista med produktkoder." });
        }

        // Hämta produkter från databasen
        const products = await prisma.products.findMany({
            where: { sku: { in: product_codes } }
        });

        // Hämta saldo från inventory-service (ChatGPT gjorde queryString)
        const queryString = product_codes.map(code => `productCodes=${code}`).join("&");
        const inventoryResp = await fetch(`https://inventory-service-inventory-service.2.rahtiapp.fi/inventory?${queryString}`);

        if (!inventoryResp.ok) {
            console.error("Misslyckades hämta lagerdata:", await inventoryResp.text());
            return res.status(500).json({ error: "Kunde inte hämta lagerdata." });
        }

        const inventoryData = await inventoryResp.json();

        // Kombinera produkter med saldo
        const productsWithInventory = products.map(product => {
            const inventory = inventoryData.find(item => item.productCode === product.sku);
            return { ...product, stock: inventory ? inventory.stock : 0 };
        });

        res.json({ products: productsWithInventory });
    } catch (error) {
        console.error("Fel vid hämtning av produkter:", error);
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

        if (!stock) {
            return res.status(400).json({ msg: "Ange saldo." });
        }

        const inventoryData = [{ productCode: sku, stock }];

        const result = await prisma.$transaction(async (tx) => {
            // Skapa produkt i databasen
            const product = await tx.products.create({
                data: { sku, name, price, description, image: imagePath, country, category }
            });

            // Skapa produkt i inventory-service
            const inventoryResp = await fetch("https://inventory-service-inventory-service.2.rahtiapp.fi/inventory", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${req.userData.token}`
                },
                body: JSON.stringify(inventoryData),
            });

            if (!inventoryResp.ok) {
                throw new Error(await inventoryResp.text());
            }

            return product;
        });

        res.status(201).json({ msg: "Ny produkt skapades!", product: result });

    } catch (error) {
        console.error("Fel vid skapande av produkt:", error.message);
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

        // Lägg till parametrar bara om de är angivna
        if (name?.trim()) data.name = name;
        if (!isNaN(price)) data.price = parseFloat(price).toFixed(2);
        if (description?.trim()) data.description = description;
        if (req.file) data.image = `/uploads/${req.file.filename}`;

        // Uppdatera produkt i databasen
        const product = await prisma.products.update({
            where: { sku: req.params.sku },
            data,
        });

        res.status(200).json({ msg: "Produkten uppdaterades.", product });
    } catch (error) {
        console.error("Fel vid uppdatering av produkt:", error.message);
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

        await prisma.$transaction(async (tx) => {
            // Ta bort produkt från databasen
            await tx.products.delete({ where: { sku } });

            // Ta bort från inventory-service
            const inventoryResp = await fetch("https://inventory-service-inventory-service.2.rahtiapp.fi/inventory", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${req.userData.token}`
                },
                body: JSON.stringify([{ productCode: sku }])
            });

            if (!inventoryResp.ok) {
                throw new Error(await inventoryResp.text());
            }
        });

        res.status(204).send();
    } catch (error) {
        console.error("Fel vid borttagning av produkt:", error.message);
        res.status(500).json({ msg: "Fel vid borttagning av produkt.", error: error.message });
    }
});

module.exports = router;