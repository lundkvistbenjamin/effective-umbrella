const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { Product, CreateProduct, UpdateProduct } = require("./schemas/Product.js");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Beer Product API",
            version: "1.0.0",
            description: "API for managing beer products.",
        },
        servers: [
            {
                url: "https://effective-umbrella-cna-product-service.2.rahtiapp.fi/",
                description: "Environment-based API URL",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                Product,
                CreateProduct,
                UpdateProduct,
            }
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ["src/routes/products.js"],
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerDocs = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = swaggerDocs;