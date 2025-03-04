const INVENTORY_URL = process.env.INVENTORY_URL;

const fetchAllInventory = async () => {
    const inventoryResp = await fetch(`${INVENTORY_URL}`);

    if (!inventoryResp.ok) {
        throw new Error(`Failed to fetch all inventory: ${await inventoryResp.text()}`);
    }

    return inventoryResp.json();
};

const fetchInventoryBatch = async (productCodes) => {
    const queryString = productCodes.map(code => `productCodes=${code}`).join("&");
    const inventoryResp = await fetch(`${INVENTORY_URL}?${queryString}`);

    if (!inventoryResp.ok) {
        throw new Error(`Failed to fetch inventory batch: ${await inventoryResp.text()}`);
    }

    return inventoryResp.json();
};

const fetchInventoryBySKU = async (productCode) => {
    const inventoryResp = await fetch(`${INVENTORY_URL}/?productCodes=${productCode}`);

    if (!inventoryResp.ok) {
        throw new Error(`Failed to fetch inventory: ${await inventoryResp.text()}`);
    }

    const inventoryData = await inventoryResp.json();
    return inventoryData.find(item => item.productCode === productCode);
};

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
    fetchInventoryBySKU,
    createInventory,
    deleteInventory
};