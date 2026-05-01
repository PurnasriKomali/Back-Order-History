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

        onAfterRendering: function() {
            // Wait for rendering to ensure binding is accessible
            var oTable = this.getView().byId("idBackOrderTable");
            var oBinding = oTable.getBinding("items");
            
            if (oBinding) {
                oBinding.attachDataReceived(function() {
                    var iCount = oBinding.getCount();
                    this.getView().byId("tableTitle").setText("Items (" + iCount + ")");
                }.bind(this));
            }
        },

        onSearch: function () {
            var oTable = this.getView().byId("idBackOrderTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            // 1. Sold-To (Mandatory)
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
                var sTargetField = sSearchBy === "orderNumber" ? "erpOrderNumber" : sSearchBy;
                var oOperator = (sSearchBy === "orderNumber" || sSearchBy === "invoiceNumber") ? FilterOperator.EQ : FilterOperator.Contains;
                aFilters.push(new Filter(sTargetField, oOperator, sSearchValue));
            }

            // 4. Date Range
            var oDateRange = this.getView().byId("idDateRange");
            var oFromDate = oDateRange.getDateValue();
            var oToDate = oDateRange.getSecondDateValue();
            if (oFromDate && oToDate) {
                aFilters.push(new Filter("orderDate", FilterOperator.BT, oFromDate.toISOString(), oToDate.toISOString()));
            } else if (oFromDate) {
                aFilters.push(new Filter("orderDate", FilterOperator.GE, oFromDate.toISOString()));
            }

            // Apply filters
            this._iCurrentPage = 1;
            this._updatePaginationUI();
            oBinding.filter(aFilters);
        },

        onPageChange: function (oEvent) {
            var sId = oEvent.getSource().getId();
            var bNext = sId.includes("NextButton");
            this._iCurrentPage = bNext ? this._iCurrentPage + 1 : Math.max(1, this._iCurrentPage - 1);

            var oBinding = this.getView().byId("idBackOrderTable").getBinding("items");
            oBinding.changeParameters({ $skip: (this._iCurrentPage - 1) * this._iPageSize });
            this._updatePaginationUI();
        },

        _updatePaginationUI: function () {
            this.getView().byId("idPageNumber").setText("Page " + this._iCurrentPage);
            this.getView().byId("idPrevButton").setEnabled(this._iCurrentPage > 1);
        },

        onSort: function () {
            var oBinding = this.getView().byId("idBackOrderTable").getBinding("items");
            this._bSortDesc = !this._bSortDesc;
            oBinding.sort(new sap.ui.model.Sorter("orderDate", this._bSortDesc));
            MessageToast.show("Sorted by Date " + (this._bSortDesc ? "Descending" : "Ascending"));
        },

        onTokenUpdate: function (oEvent) {
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
