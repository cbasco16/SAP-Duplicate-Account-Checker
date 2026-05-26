sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/odata/v4/ODataModel", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/MessageToast", "sap/ui/export/Spreadsheet", "sap/ui/core/routing/History"], function (Controller, ODataModel, Filter, FilterOperator, MessageToast, Spreadsheet, History) {
  "use strict";

  return Controller.extend("com.myorg.duplicatecheck.controller.Report", {
    onInit() {
      this.byId("reportTable").attachEventOnce("updateFinished", () => {
        const oBinding = this._getTableBinding();
        if (!oBinding) return;
        oBinding.attachEvent("dataReceived", oEvent => {
          const oError = oEvent.getParameter("error");
          if (oError) {
            console.error("OData error:", oError);
            MessageToast.show("Failed to load data: " + (oError.message || "Unknown error"));
            return;
          }
          this._updateCount();
        });
      });
    },
    // ── Navigation ────────────────────────────────────────────────────────

    onNavBack() {
      const sPreviousHash = History.getInstance().getPreviousHash();
      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getOwnerComponent().getRouter().navTo("Dashboard");
      }
    },
    onItemPress(oEvent) {
      const oCtx = oEvent.getSource().getBindingContext("persons");
      const sID = oCtx.getProperty("ID");
      MessageToast.show("Selected ID: " + sID);
    },
    // ── Filtering & Search ────────────────────────────────────────────────

    onApplyFilters() {
      const oBinding = this._getTableBinding();
      if (!oBinding) return;
      const aFilters = [];
      const oStartDate = this.byId("startDate").getDateValue();
      const oEndDate = this.byId("endDate").getDateValue();
      if (oStartDate) {
        aFilters.push(new Filter({
          path: "createdAt",
          operator: FilterOperator.GE,
          value1: oStartDate.toISOString()
        }));
      }
      if (oEndDate) {
        // Set to end of day so the filter is inclusive
        oEndDate.setHours(23, 59, 59, 999);
        aFilters.push(new Filter({
          path: "createdAt",
          operator: FilterOperator.LE,
          value1: oEndDate.toISOString()
        }));
      }
      oBinding.filter(aFilters);
    },
    onSearch(oEvent) {
      const oBinding = this._getTableBinding();
      if (!oBinding) return;
      const sQuery = oEvent.getParameter("query");
      const aFilters = [];
      if (sQuery) {
        aFilters.push(new Filter({
          filters: [new Filter("firstName", FilterOperator.Contains, sQuery), new Filter("lastName", FilterOperator.Contains, sQuery), new Filter("email", FilterOperator.Contains, sQuery), new Filter("companyName", FilterOperator.Contains, sQuery), new Filter("phone", FilterOperator.Contains, sQuery)],
          and: false
        }));
      }
      oBinding.filter(aFilters);
    },
    // ── Actions ───────────────────────────────────────────────────────────

    onRefresh() {
      const oBinding = this._getTableBinding();
      if (!oBinding) return;
      oBinding.refresh();
      MessageToast.show("Refreshing data...");
    },
    onDownload() {
      const oBinding = this._getTableBinding();
      if (!oBinding) return;
      const oSettings = {
        workbook: {
          columns: [{
            label: "First Name",
            property: "firstName"
          }, {
            label: "Last Name",
            property: "lastName"
          }, {
            label: "Company",
            property: "companyName"
          }, {
            label: "Email",
            property: "email"
          }, {
            label: "Phone",
            property: "phone"
          }, {
            label: "Street",
            property: "street"
          }, {
            label: "Postal Code",
            property: "postalCode"
          }, {
            label: "City",
            property: "city"
          }, {
            label: "Region",
            property: "region"
          }, {
            label: "Country",
            property: "country"
          }, {
            label: "Created At",
            property: "createdAt",
            type: "DateTime"
          }]
        },
        dataSource: oBinding,
        fileName: "PersonsReport.xlsx"
      };
      const oSheet = new Spreadsheet(oSettings);
      oSheet.build().finally(() => oSheet.destroy());
    },
    // ── Helpers ───────────────────────────────────────────────────────────

    _getTableBinding() {
      const oTable = this.byId("reportTable");
      if (!oTable) {
        console.error("reportTable not found — check view id");
        return null;
      }
      const oBinding = oTable.getBinding("items");
      if (!oBinding) {
        console.error("items binding not ready — OData model may not be registered");
        return null;
      }
      return oBinding;
    },
    _updateCount() {
      const oBinding = this._getTableBinding();
      if (!oBinding) return;
      const iCount = oBinding.getCount();
      const oText = this.byId("recordCountText");
      if (oText) {
        oText.setText(iCount !== undefined ? `${iCount} records found` : "");
      }
    }
  });
});
//# sourceMappingURL=Report-dbg.controller.js.map
