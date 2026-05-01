namespace BackOrderHistory;

/**
 * BackOrderItems - Core entity storing all back order item records.
 * Maps to the "entries" array in the API response.
 */
entity BackOrderItems {
    key ID             : UUID;
    soldTo             : String(255);   // Customer sold-to number
    shipTo             : String(255);   // Ship-to number
    productCode        : String(255);   // SKU / Product Code
    itemNumber         : String(255);   // Item Number
    quantity           : Integer;       // Quantity ordered
    dealerPrice        : Decimal(15,2); // Price per unit
    totalPrice         : Decimal(15,2); // Total price (qty * dealerPrice)
    currency           : String(10);    // ISO currency code e.g. EUR, USD
    erpOrderNumber     : String(50);    // EP1/ERP order number
    invoiceNumber      : String(50);    // Invoice number
    poNumber           : String(255);   // Purchase Order (PO) number
    orderDate          : String(50);    // ISO 8601 date string
    orderStatus        : String(10);    // Order status code e.g. 1,2,3
}
