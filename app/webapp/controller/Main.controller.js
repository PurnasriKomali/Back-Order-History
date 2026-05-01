sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("ns.backorder.controller.Main", {
        onInit: function () {
            this._iCurrentPage = 1;
            this._iPageSize = 12;
        },

        onSearch: function () {
            var oTable = this.getView().byId("idBackOrderTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            // 1. Sold-To (Mandatory in spec)
            var sSoldTo = this.getView().byId("idSoldTo").getValue();
            if (sSoldTo) {
                aFilters.push(new Filter("soldTo", FilterOperator.EQ, sSoldTo));
            } else {
                MessageToast.show("Sold-To is required");
                return;
            }

            // 2. Ship-To (Multi)
            var aShipToTokens = this.getView().byId("idShipTo").getTokens();
            if (aShipToTokens.length > 0) {
                var aShipToFilters = aShipToTokens.map(function(oToken) {
                    return new Filter("shipTo", FilterOperator.Contains, oToken.getKey());
                });
                aFilters.push(new Filter({
                    filters: aShipToFilters,
                    and: false
                }));
            }

            // 3. SearchBy + SearchValue
            var sSearchBy = this.getView().byId("idSearchBy").getSelectedKey();
            var sSearchValue = this.getView().byId("idSearchValue").getValue();
            if (sSearchValue) {
                // Spec says complete match for numbers, partial for PO/Item
                var oOperator = (sSearchBy === "orderNumber" || sSearchBy === "invoiceNumber") ? FilterOperator.EQ : FilterOperator.Contains;
                aFilters.push(new Filter(sSearchBy, oOperator, sSearchValue));
            }

            // 4. Date Range
            var oDateRange = this.getView().byId("idDateRange");
            var oFromDate = oDateRange.getDateValue();
            var oToDate = oDateRange.getSecondDateValue();
            if (oFromDate) {
                aFilters.push(new Filter("orderDate", FilterOperator.GE, oFromDate.toISOString()));
            }
            if (oToDate) {
                aFilters.push(new Filter("orderDate", FilterOperator.LE, oToDate.toISOString()));
            }

            // Reset pagination and apply
            this._iCurrentPage = 1;
            this._updatePaginationUI();
            oBinding.filter(aFilters);
            oBinding.changeParameters({ $skip: 0, $top: this._iPageSize });
        },

        onPageChange: function (oEvent) {
            var sId = oEvent.getSource().getId();
            var bNext = sId.includes("NextButton");
            
            if (bNext) {
                this._iCurrentPage++;
            } else {
                this._iCurrentPage = Math.max(1, this._iCurrentPage - 1);
            }

            var oTable = this.getView().byId("idBackOrderTable");
            var oBinding = oTable.getBinding("items");
            var iSkip = (this._iCurrentPage - 1) * this._iPageSize;

            oBinding.changeParameters({
                $skip: iSkip,
                $top: this._iPageSize
            });

            this._updatePaginationUI();
        },

        _updatePaginationUI: function () {
            this.getView().byId("idPageNumber").setText("Page " + this._iCurrentPage);
            this.getView().byId("idPrevButton").setEnabled(this._iCurrentPage > 1);
        },

        onSort: function () {
            // Simple toggle sort for demo
            var oTable = this.getView().byId("idBackOrderTable");
            var oBinding = oTable.getBinding("items");
            var bDesc = this._bSortDesc = !this._bSortDesc;
            
            oBinding.sort(new sap.ui.model.Sorter("orderDate", bDesc));
            MessageToast.show("Sorted by Date " + (bDesc ? "Descending" : "Ascending"));
        },

        onTokenUpdate: function (oEvent) {
            // Logic to handle manual entry of tokens in MultiInput
            if (oEvent.getParameter("type") === "added") {
                var aAddedTokens = oEvent.getParameter("addedTokens");
                var oMultiInput = oEvent.getSource();
                aAddedTokens.forEach(function (oToken) {
                    oMultiInput.addToken(oToken);
                });
            }
        }
    });
});
