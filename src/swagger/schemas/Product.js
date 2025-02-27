module.exports = {
    Product: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Craft Beer IPA" },
            price: { type: "number", format: "double", example: 5.99 },
            description: { type: "string", example: "A refreshing craft beer." },
            image: { type: "string", example: "https://example.com/image.jpg" },
            country: { type: "string", example: "Finland" },
            category: { type: "string", example: "IPA" },
            created_at: { type: "string", format: "date-time", example: "2024-02-24T12:00:00Z" },
            updated_at: { type: "string", format: "date-time", example: "2024-02-25T12:00:00Z" }
        },
        required: ["id", "name", "price", "country", "category"]
    },

    CreateProduct: {
        type: "object",
        properties: {
            name: { type: "string", example: "Lapin Kulta", default: "Lapin Kulta" },
            price: { type: "number", format: "double", example: 1, default: 1.00 },
            description: { type: "string", example: "Ugh.", default: "Ugh." },
            image: { type: "string", example: "path-to-image", default: "default-image.jpg" },
            country: { type: "string", example: "Finland", default: "Finland" },
            category: { type: "string", example: "Lager", default: "Lager" },
            stock: { type: "integer", example: 1 }
        },
        required: ["name", "price", "country", "category"]
    },

    UpdateProduct: {
        type: "object",
        properties: {
            name: { type: "string", example: "Pale Ale Special Edition" },
            price: { type: "number", format: "double", example: 69.99 },
            description: { type: "string", example: "A limited edition pale ale." },
            image: { type: "string", example: "https://example.com/special-edition.jpg" },
            country: { type: "string", example: "Finland" },
            category: { type: "string", example: "Pale Ale" }
        }
    },

     BatchRequest: {
        type: "object",
        properties: {
            product_codes: {
                type: "array",
                items: {
                    type: "string"
                },
                example: ["10000-FIL", "10000-FII", "10000-MXL"]
            }
        },
        required: ["product_codes"]
    }
};
