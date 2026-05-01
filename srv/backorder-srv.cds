using { BackOrderHistory as db } from '../db/schema';

service BackOrderService @(path: '/api/backorder') {

    /**
     * SearchRequest - Virtual entity for the POST request body.
     * @cds.persistence.skip means this is NOT stored in the database.
     * It is used only to define the shape of the input parameters.
     */
    @cds.persistence.skip
    entity SearchRequest {
        key soldTo      : String(255);  // Mandatory: Customer sold-to
        shipTo          : String(500);  // Mandatory: Comma-separated ship-to numbers e.g. "123456,234564"
        search          : String(25);   // Optional: Search value
        searchBy        : String(100);  // Optional: orderNumber | invoiceNumber | poNumber | itemNumber
        fromDate        : String(50);   // Optional: ISO 8601 from date
        toDate          : String(50);   // Optional: ISO 8601 to date
        sort            : String(50);   // Default: orderDate
        dir             : String(10);   // Default: desc
        currentPage     : Integer;      // Default: 0
        pageSize        : Integer;      // Default: 12
    }

    /**
     * BackOrderItems - Projection on the actual database entity.
     * This is the entity whose data is returned in the "entries" array.
     */
    @readonly
    @Capabilities: {
        SearchRestrictions: {Searchable: true},
        TopSupported: true,
        SkipSupported: true,
        SortRestrictions: {Sortable: true},
        CountRestrictions: {Countable: true},
        FilterRestrictions: {Filterable: true}
    }
    @odata.search.enabled: true
    @odata.count.enabled: true
    entity BackOrderItems as projection on db.BackOrderItems;
}
