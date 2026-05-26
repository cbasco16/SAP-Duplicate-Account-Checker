import Controller from "sap/ui/core/mvc/Controller";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import MessageToast from "sap/m/MessageToast";
import Spreadsheet from "sap/ui/export/Spreadsheet";
import History from "sap/ui/core/routing/History";
import DatePicker from "sap/m/DatePicker";
import Table from "sap/m/Table";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import Event from "sap/ui/base/Event";
import Text from "sap/m/Text";

/**
 * @namespace com.myorg.duplicatecheck.controller
 */
export default class Report extends Controller {

    public onInit(): void {
        (this.byId("reportTable") as Table).attachEventOnce("updateFinished", () => {
            const oBinding = this._getTableBinding();
            if (!oBinding) return;

            oBinding.attachEvent("dataReceived", (oEvent: Event) => {
                const oError = oEvent.getParameter("error");
                if (oError) {
                    console.error("OData error:", oError);
                    MessageToast.show("Failed to load data: " + (oError.message || "Unknown error"));
                    return;
                }
                this._updateCount();
            });
        });
    }

    // ── Navigation ────────────────────────────────────────────────────────

    public onNavBack(): void {
        const sPreviousHash = History.getInstance().getPreviousHash();
        if (sPreviousHash !== undefined) {
            window.history.go(-1);
        } else {
            this.getOwnerComponent().getRouter().navTo("Dashboard");
        }
    }

    public onItemPress(oEvent: Event): void {
        const oCtx = (oEvent.getSource() as any).getBindingContext("persons");
        const sID  = oCtx.getProperty("ID") as string;
        this.getOwnerComponent().getRouter().navTo("PersonDetail", { id: sID });
    }

    // ── Filtering & Search ────────────────────────────────────────────────

    public onApplyFilters(): void {
        const oBinding = this._getTableBinding();
        if (!oBinding) return;

        const aFilters: Filter[] = [];

        const oStartDate = (this.byId("startDate") as DatePicker).getDateValue();
        const oEndDate   = (this.byId("endDate")   as DatePicker).getDateValue();

        if (oStartDate) {
            aFilters.push(new Filter({
                path: "createdAt",
                operator: FilterOperator.GE,
                value1: oStartDate.toISOString()
            }));
        }
        if (oEndDate) {
            oEndDate.setHours(23, 59, 59, 999);
            aFilters.push(new Filter({
                path: "createdAt",
                operator: FilterOperator.LE,
                value1: oEndDate.toISOString()
            }));
        }

        oBinding.filter(aFilters);
    }

    public onSearch(oEvent: Event): void {
        const oBinding = this._getTableBinding();
        if (!oBinding) return;

        const sQuery = oEvent.getParameter("query") as string;
        const aFilters: Filter[] = [];

        if (sQuery) {
            aFilters.push(new Filter({
                filters: [
                    new Filter("firstName",   FilterOperator.Contains, sQuery),
                    new Filter("lastName",    FilterOperator.Contains, sQuery),
                    new Filter("email",       FilterOperator.Contains, sQuery),
                    new Filter("companyName", FilterOperator.Contains, sQuery),
                    new Filter("phone",       FilterOperator.Contains, sQuery)
                ],
                and: false
            }));
        }

        oBinding.filter(aFilters);
    }

    // ── Actions ───────────────────────────────────────────────────────────

    public onRefresh(): void {
        const oBinding = this._getTableBinding();
        if (!oBinding) return;
        oBinding.refresh();
        MessageToast.show("Refreshing data...");
    }

    public onDownload(): void {
        const oBinding = this._getTableBinding();
        if (!oBinding) return;

        const oSettings = {
            workbook: {
                columns: [
                    { label: "First Name",  property: "firstName" },
                    { label: "Last Name",   property: "lastName" },
                    { label: "Company",     property: "companyName" },
                    { label: "Email",       property: "email" },
                    { label: "Phone",       property: "phone" },
                    { label: "Street",      property: "street" },
                    { label: "Postal Code", property: "postalCode" },
                    { label: "City",        property: "city" },
                    { label: "Region",      property: "region" },
                    { label: "Country",     property: "country" },
                    { label: "Created At",  property: "createdAt", type: "DateTime" }
                ]
            },
            dataSource: oBinding,
            fileName: "PersonsReport.xlsx"
        };

        const oSheet = new Spreadsheet(oSettings);
        oSheet.build().finally(() => oSheet.destroy());
    }

    // ── Formatters ────────────────────────────────────────────────────────

    public formatDate(sValue: string): string {
        if (!sValue) return "";
        const oDate = new Date(sValue);
        return oDate.toLocaleDateString("en-GB", {
            day:   "2-digit",
            month: "short",
            year:  "numeric"
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private _getTableBinding(): ODataListBinding | null {
        const oTable = this.byId("reportTable") as Table;
        if (!oTable) {
            console.error("reportTable not found — check view id");
            return null;
        }
        const oBinding = oTable.getBinding("items") as ODataListBinding;
        if (!oBinding) {
            console.error("items binding not ready — OData model may not be registered");
            return null;
        }
        return oBinding;
    }

    private _updateCount(): void {
        const oBinding = this._getTableBinding();
        if (!oBinding) return;
        const iCount = oBinding.getCount();
        const oText  = this.byId("recordCountText") as Text;
        if (oText) {
            oText.setText(iCount !== undefined ? `${iCount} records found` : "");
        }
    }
}