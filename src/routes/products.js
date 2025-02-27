const express = require("express");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
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

const getAllInventory = async () => {
    try {
        const response = await fetch("https://inventory-service-inventory-service.2.rahtiapp.fi/inventory", {
            headers: {
                "Content-Type": "application/json"
            },
        });

        if (!response.ok) {
            throw new Error(`Error med inventory! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Misslyckades fetcha inventory:", error);
        return null; // Return null
    }
};

router.get("/", async (req, res) => {
    try {
        const products = await prisma.products.findMany();
        const inventoryData = await getAllInventory();

        if (!inventoryData || !Array.isArray(inventoryData)) {
            console.error("Fel med hämtning av saldo:", inventoryData);
            return res.status(500).json({ msg: "Fel vid hämtning av saldo." });
        }

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
        const product = await prisma.products.findUnique({
            where: { sku: req.params.sku },
        });
        if (product) {
            const inventoryResp = await fetch(`https://inventory-service-inventory-service.2.rahtiapp.fi/inventory/${req.params.sku}`, {
                headers: {
                    "Content-Type": "application/json"
                },
            });

            if (inventoryResp.ok) {
                const inventory = await inventoryResp.json();
                const stock = inventory.stock;
                res.status(200).json({ msg: "Produkt hämtades.", product: { ...product, stock } });
            } else {
                console.error("Misslyckades hämta saldo:", await inventoryResp.text());
                return res.status(500).json({ msg: "Kunde inte hämta saldo." });
            }


        } else {
            res.status(404).json({ msg: "Produkten hittades inte." });
        }
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
 *             type: object
 *             properties:
 *               product_codes:
 *                 type: array
 *                 items:
 *                   type: string
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
 *                     $ref: '#/components/schemas/BatchRequest'
 *       400:
 *         description: Invalid request. Missing or incorrect product codes.
 *       500:
 *         description: Error fetching products.
 */


router.post("/batch", async (req, res) => {
    const { product_codes } = req.body;

    if (!Array.isArray(product_codes) || product_codes.length === 0) {
        return res.status(400).json({ error: "Skicka en lista." });
    }

    console.log("Product Codes:", product_codes);

    try {
        const products = await prisma.products.findMany({
            where: { sku: { in: product_codes } } 
        });

        res.json({ products });
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Error fetching products" });
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
    const { name, price, description, country, category, stock } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // Kollar om användaren angett stock
    if (!stock) {
        return res.status(400).json({ msg: "Ange stock" });
    }

    // Inventory data
    const invData = [{
        productCode: req.body.sku,
        stock: stock
    }];

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Skapa produkt i databasen
            const product = await tx.products.create({
                data: {
                    sku: req.body.sku,
                    name,
                    price,
                    description,
                    image: imagePath,
                    country,
                    category
                }
            });

            // Skapa produkt i inventory service
            const inventoryResponse = await fetch("https://inventory-service-inventory-service.2.rahtiapp.fi/inventory", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${req.userData.token}`
                },
                body: JSON.stringify(invData),
            });

            if (!inventoryResponse.ok) {
                const errorText = await inventoryResponse.text();
                console.error("Uppdatering av inventory misslyckades:", errorText);
                throw new Error("Uppdatering av inventory misslyckades: " + errorText);
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
    const { name, price, description } = req.body;
    const data = { updated_at: new Date() };

    // Uppdatera bara om användaren angett values
    if (name && name.trim() !== "") data.name = name;
    if (price && !isNaN(price)) data.price = price.toFixed(2);
    if (description && description.trim() !== "") data.description = description;
    if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
    }

    try {
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
    const { sku } = req.params;
    const delData = [{ productCode: sku }];

    try {
        await prisma.$transaction(async (tx) => {
            // Ta bort produkt från databasen
            await tx.products.delete({
                where: { sku },
            });

            // Ta bort från inventory service
            const inventoryResponse = await fetch("https://inventory-service-inventory-service.2.rahtiapp.fi/inventory", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${req.userData.token}`
                },
                body: JSON.stringify(delData)
            });

            if (!inventoryResponse.ok) {
                const errorText = await inventoryResponse.text();
                console.error("Borttagning av inventory misslyckades:", errorText);
                throw new Error("Borttagning av inventory misslyckades: " + errorText);
            }
        });

        res.status(204).send();
    } catch (error) {
        console.error("Fel vid borttagning av produkt:", error.message);
        res.status(500).json({ msg: "Fel vid borttagning av produkt.", error: error.message });
    }
});

module.exports = router;