# Product API - E-handelsprojekt  

Detta API hanterar produktinformationen för vår e-handelsplattform som säljer hantverksöl. API:et följer REST-standard och använder unika produktkoder (t.ex. SKU eller artikelnummer) för att identifiera produkter, istället för databas-ID:n.  

## Funktionalitet  
- Lägg till nya produkter  
- Hämta information om produkter  
- Uppdatera produktinformation  
- Ta bort produkter  

## Endpoints  

### Hämta alla produkter  
**GET /api/products**  
- **Beskrivning:** Hämtar en lista över alla produkter.  
- **Svarsexempel:**

```
{
    "sku": "123-ABC",
    "name": "Pale Ale",
    "price": 59.99,
    "description": "En fruktig och frisk pale ale.",
    "image": "path-to-image",
    "created_at": 01:01:2024:20:54,
    "updated_at": 01:01:2024:20:54
    },
    {
    "sku": "456-DEF",
    "name": "Stout",
    "price": 69.99,
    "description": "En fyllig och mörk stout.",
    "image": "path-to-image",
    "created_at": 01:01:2024:20:54,
    "updated_at": 01:01:2024:20:54
    }
```

### Hämta en specifik produkt
**GET /api/products/{sku}**
- **Beskrivning:** Hämtar information om en specifik produkt baserat på dess SKU.
- **Exempel:** GET /api/products/123-ABC
- **Svarsexempel:**

```
{
    "sku": "123-ABC",
    "name": "Pale Ale",
    "price": 59.99,
    "description": "En fruktig och frisk pale ale.",
    "image": "path-to-image",
    "created_at": 01:01:2024:20:54,
    "updated_at": 01:01:2024:20:54
}
```

### Lägg till en ny produkt
**POST /api/products**
- **Beskrivning:** Lägger till en ny produkt.
- **Begäransexempel:**

```
{
    "sku": "789-GHI",
    "name": "IPA", 
    "price": 64.99,
    "description": "En kraftig och humlearomatisk IPA.",
    "image": "path-to-image"
}
```

**Svarsexempel:**

```
{
    "message": "Produkten har lagts till.",
    "product": 
    {
    "sku": "789-GHI",
    "name": "IPA", 
    "price": 64.99,
    "description": "En kraftig och humlearomatisk IPA.",
    "image": "path-to-image",
    "created_at": 01:01:2024:20:54,
    "updated_at": 01:01:2024:20:54
  }
}
```
  
### Uppdatera en produkt
**PUT /api/products/{sku}***
- **Beskrivning:** Uppdaterar information om en befintlig produkt baserat på dess SKU.
- **Exempel:** PUT /api/products/123-ABC
- **Begäransexempel:**

```
{
    "name": "Pale Ale Special Edition",
    "price": 69.99
}
```

**Svarsexempel:**

```
{
    "message": "Produkten har uppdaterats.",
    "product": {
    "sku": "789-GHI",
    "name": "IPA", 
    "price": 64.99,
    "description": "En kraftig och humlearomatisk IPA.",
    "image": "path-to-image",
    "created_at": 01:01:2024:20:54,
    "updated_at": 01:01:2024:20:54
  }
}
```

### Ta bort en produkt
**DELETE /api/products/{sku}**
- **Beskrivning:** Tar bort en produkt baserat på dess SKU.
- **Exempel:** DELETE /api/products/123-ABC
- **Svarsexempel:**

```
{
        "message": "Produkten har tagits bort."
}
```

## Produktkoder

### Format
- 123-ABC
### Hur produktkoden byggs upp
**Siffrorna (123)**
- **Id** för produkter i denna kategori
    - 100-999

**Bokstäverna (ABC)**
- **Landskoder** (första två bokstäverna)
  - US → USA
  - GE → Tyskland
  - BE → Belgien
  - UK → Storbritannien
  - CZ → Tjeckien
  - MX → Mexiko
  - JP → Japan
  - CA → Kanada
  - NL → Nederländerna
  - AU → Australien
  - IE → Irland
  
- **Ölstilkoder** (tredje bokstaven)
  - L → Lager
  - A → Ale
  - I → IPA
  - S → Stout & Porter
  - W → Veteöl
  - P → Pilsner
  - O → Suröl & Specialöl

 ### Exempel på produktkoder & tolkningar
- 101-USL → Amerikansk Lager
- 310-BEA → Belgisk Ale
- 843-GEI → Tysk IPA
- 625-IES → Irländsk Stout
- 420-CZW → Tjeckiskt Veteöl
- 625-MXP → Mexikansk Pilsner
  
