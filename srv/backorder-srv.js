/**
 * BackOrderService - Custom handler for Back Order History API
 *
 * Implements the search logic defined in:
 * ERP_Interface_backOrderHistory_07162024
 *
 * Handles:
 *  - Search by: orderNumber, invoiceNumber, poNumber, itemNumber
 *  - Date range filtering (fromDate, toDate)
 *  - Sorting (orderDate, orderNumber, itemNumber)
 *  - Pagination (currentPage, pageSize)
 */
module.exports = cds.service.impl(async function () {

    const { BackOrderItems } = this.entities;

    /**
     * POST /api/backorder/SearchRequest
     * Handles the main search and filter for Back Order Items.
     */
    this.on('CREATE', 'SearchRequest', async (req) => {
        const {
            soldTo,
            shipTo = '',        // Comma-separated ship-to numbers e.g. "123456,234564"
            search = '',
            searchBy = '',
            fromDate = '',
            toDate = '',
            sort = 'orderDate',
            dir = 'desc',
            currentPage = 0,
            pageSize = 20       // Default is 20 as per spec
        } = req.data;

        // Parse shipTo - accepts both comma-separated string and array
        const shipToList = Array.isArray(shipTo)
            ? shipTo
            : (shipTo ? shipTo.split(',').map(s => s.trim()).filter(Boolean) : []);

        // Validate mandatory fields
        if (!soldTo) {
            return req.error(400, 'soldTo is a mandatory field.');
        }
        if (!shipToList || shipToList.length === 0) {
            return req.error(400, 'shipTo is a mandatory field and must contain at least one value.');
        }

        try {
            // Start building the base query - always filter by soldTo
            let query = SELECT.from(BackOrderItems).where({ soldTo: soldTo });

            // Filter by shipTo list - item must match any of the provided shipTo values
            if (shipToList && shipToList.length > 0) {
                query.where({ shipTo: { in: shipToList } });
            }

            // Apply search filter based on searchBy field
            if (search && searchBy) {
                switch (searchBy.toLowerCase()) {
                    case 'ordernumber':
                        query.where({ erpOrderNumber: search });
                        break;
                    case 'invoicenumber':
                        query.where({ invoiceNumber: search });
                        break;
                    case 'ponumber':
                        // poNumber uses partial/case-insensitive match
                        query.where(`lower(poNumber) like lower('%${search}%')`);
                        break;
                    case 'itemnumber':
                        // itemNumber uses partial/case-insensitive match
                        query.where(`lower(itemNumber) like lower('%${search}%')`);
                        break;
                    default:
                        break;
                }
            }

            // Apply date range filter
            if (fromDate) {
                query.where(`orderDate >= '${fromDate}'`);
            }
            if (toDate) {
                query.where(`orderDate <= '${toDate}'`);
            }

            // Execute query to get total count AFTER all filters are applied
            const allResults = await cds.run(query);
            const totalResults = allResults.length;
            const totalPages = Math.ceil(totalResults / pageSize);

            // Apply sorting
            const sortField = sort || 'orderDate';
            const sortDir = (dir || 'desc').toUpperCase();
            const validSortFields = ['orderDate', 'erpOrderNumber', 'itemNumber'];
            const finalSortField = validSortFields.includes(sortField) ? sortField : 'orderDate';

            // Apply pagination
            const offset = currentPage * pageSize;

            // Final query - copy all filters from the base query
            const paginatedQuery = SELECT.from(BackOrderItems)
                .where(query.SELECT.where)
                .orderBy(`${finalSortField} ${sortDir}`)
                .limit(pageSize, offset);

            const entries = await cds.run(paginatedQuery);

            // Return null if no results found (as per spec)
            if (!entries || entries.length === 0) {
                return null;
            }

            // Format the response to match the spec
            return {
                entries: entries.map(item => ({
                    productCode:    item.productCode,
                    quantity:       item.quantity,
                    currency:       item.currency,
                    dealerPrice:    item.dealerPrice,
                    totalPrice:     item.totalPrice,
                    erpOrderNumber: item.erpOrderNumber,
                    orderDate:      item.orderDate,
                    orderStatus:    item.orderStatus
                })),
                currentPage:  currentPage,
                pageSize:     pageSize,
                totalPages:   totalPages,
                totalResults: totalResults
            };

        } catch (err) {
            // Return error in spec format
            return req.error(500, JSON.stringify({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    description: err.message
                }
            }));
        }
    });
});
