const INVENTORY_URL = process.env.INVENTORY_URL;

// Hämta all information från inventory-sercvice
const fetchAllInventory = async () => {
    const inventoryResp = await fetch(`${INVENTORY_URL}`);

    if (!inventoryResp.ok) {
        throw new Error(`Failed to fetch all inventory: ${await inventoryResp.text()}`);
    }

    return inventoryResp.json();
};

// Hämta en eller flera items från inventory-sercvice
const fetchInventoryBatch = async (productCodes) => {
    const queryString = productCodes.map(code => `productCodes=${code}`).join("&");
    const inventoryResp = await fetch(`${INVENTORY_URL}?${queryString}`);

    if (!inventoryResp.ok) {
        throw new Error(`Failed to fetch inventory batch: ${await inventoryResp.text()}`);
    }

    return inventoryResp.json();
};

// Skapa ny produktdata i inventory-sercvice
const createInventory = async (token, inventoryData) => {
    const inventoryResp = await fetch(`${INVENTORY_URL}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(inventoryData),
    });

    if (!inventoryResp.ok) {
        throw new Error(`Failed to create inventory: ${await inventoryResp.text()}`);
    }
};

// Ta bort en item från inventory-sercvice
const deleteInventory = async (token, inventoryData) => {
    const inventoryResp = await fetch(`${INVENTORY_URL}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(inventoryData)
    });

    if (!inventoryResp.ok) {
        throw new Error(`Failed to delete inventory: ${await inventoryResp.text()}`);
    }
};

module.exports = {
    fetchAllInventory,
    fetchInventoryBatch,
    createInventory,
    deleteInventory
};