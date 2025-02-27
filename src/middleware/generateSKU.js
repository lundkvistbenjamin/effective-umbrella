const countries = {
    "USA": "US",
    "Kanada": "CA",
    "Tyskland": "DE",
    "Storbritannien": "GB",
    "Frankrike": "FR",
    "Italien": "IT",
    "Spanien": "ES",
    "Australien": "AU",
    "Japan": "JP",
    "Brasilien": "BR",
    "Indien": "IN",
    "Mexiko": "MX",
    "Nederländerna": "NL",
    "Kina": "CN",
    "Sydkorea": "KR",
    "Sydafrika": "ZA",
    "Nya Zeeland": "NZ",
    "Belgien": "BE",
    "Sverige": "SE",
    "Schweiz": "CH",
    "Danmark": "DK",
    "Norge": "NO",
    "Finland": "FI",
    "Irland": "IE",
    "Ryssland": "RU",
    "Argentina": "AR",
    "Tjeckien": "CZ",
    "Polen": "PL",
    "Österrike": "AT",
    "Vietnam": "VN",
    "Thailand": "TH",
    "Filippinerna": "PH",
    "Colombia": "CO",
    "Peru": "PE",
    "Chile": "CL",
    "Ukraina": "UA",
    "Serbien": "RS",
    "Ungern": "HU"
};


const categories = {
    "Lager": "L",
    "Ale": "A",
    "IPA": "I",
    "Stout & Porter": "S",
    "Veteöl": "W",
    "Pilsner": "P",
    "Suröl & Specialöl": "O"
};

const generateNumber = async (prisma, countryCode, categoryCode) => {
    let number = 10000;
    let sku;

    while (true) {
        sku = `${number}-${countryCode}${categoryCode}`;

        const existingSKU = await prisma.products.findUnique({
            where: { sku }
        });

        if (!existingSKU) {
            return sku; // Hittade en unik SKU
        }

        number++;
    }
};

const generateSKU = (prisma) => async (req, res, next) => {
    try {
        const { country, category } = req.body;

        if (!country || !category) {
            return res.status(400).json({ error: "Land och Kategori krävs" });
        }

        // Get the real country code
        const countryCode = countries[country];

        if (!countryCode) {
            return res.status(400).json({ error: "Inte ett giltigt land" });
        }

        // Get the mapped category code
        const categoryCode = categories[category];

        if (!categoryCode) {
            return res.status(400).json({ error: "Inte en giltig kategori" });
        }

        // Generate a unique SKU
        const sku = await generateNumber(prisma, countryCode, categoryCode);

        // Attach SKU to request
        req.body.sku = sku;

        next();
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = generateSKU;
