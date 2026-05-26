import Controller from "sap/ui/core/mvc/Controller";
import History from "sap/ui/core/routing/History";
import Text from "sap/m/Text";
import Button from "sap/m/Button";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";

/**
 * @namespace com.myorg.duplicatecheck.controller
 */
export default class PersonDetail extends Controller {

    // Track reveal state per field
    private _revealed: Record<string, boolean> = {
        taxNumber:         false,
        bankHolderName:    false,
        bankAccountNumber: false
    };

    public onInit(): void {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.getRoute("PersonDetail")?.attachPatternMatched(
            this._onPatternMatched.bind(this),
            this
        );
    }

    private _onPatternMatched(oEvent: Route$PatternMatchedEvent): void {
        const sId = oEvent.getParameter("arguments")?.id as string;

        if (!sId) {
            this.onNavBack();
            return;
        }

        // Reset all masks on every navigation
        this._revealed = {
            taxNumber:         false,
            bankHolderName:    false,
            bankAccountNumber: false
        };
        this._syncMaskUI();

        const sPath = `/Persons(${sId})`;
        (this.getView() as any).bindElement({
            path: sPath,
            model: "persons",
            parameters: {
                $select: [
                    "ID", "firstName", "lastName", "companyName",
                    "email", "phone", "street", "city", "postalCode",
                    "region", "country", "taxNumber", "bankHolderName",
                    "bankAccountNumber", "bankName", "createdAt"
                ].join(",")
            },
            events: {
                dataReceived: (oData: any) => {
                    if (!oData.getParameter("data")) {
                        this.onNavBack();
                    }
                }
            }
        });
    }

    // ── Mask Toggle Handlers ──────────────────────────────────────────────

    public onToggleTaxNumber(): void {
        this._toggle("taxNumber", "taxNumberText", "taxNumberToggle");
    }

    public onToggleBankHolder(): void {
        this._toggle("bankHolderName", "bankHolderText", "bankHolderToggle");
    }

    public onToggleBankAccount(): void {
        this._toggle("bankAccountNumber", "bankAccountText", "bankAccountToggle");
    }

    private _toggle(sField: string, sTextId: string, sButtonId: string): void {
        this._revealed[sField] = !this._revealed[sField];

        const oCtx  = this.getView()?.getBindingContext("persons");
        const sVal  = oCtx?.getProperty(sField) as string ?? "";

        const oText   = this.byId(sTextId)   as Text;
        const oButton = this.byId(sButtonId) as Button;

        oText.setText(
            this._revealed[sField] ? sVal : this._mask(sVal)
        );
        oButton.setIcon(
            this._revealed[sField] ? "sap-icon://hide" : "sap-icon://show"
        );
        oButton.setTooltip(
            this._revealed[sField] ? "Hide" : "Show"
        );
    }

    private _syncMaskUI(): void {
        // Re-apply masks after navigation (fields may still show previous values)
        const aFields = [
            { field: "taxNumber",         textId: "taxNumberText",   btnId: "taxNumberToggle"   },
            { field: "bankHolderName",     textId: "bankHolderText",  btnId: "bankHolderToggle"  },
            { field: "bankAccountNumber",  textId: "bankAccountText", btnId: "bankAccountToggle" }
        ];
        aFields.forEach(({ field, textId, btnId }) => {
            const oText   = this.byId(textId)   as Text;
            const oButton = this.byId(btnId)     as Button;
            if (oText)   oText.setText("••••••••");
            if (oButton) oButton.setIcon("sap-icon://show");
        });
    }

    // ── Formatters ────────────────────────────────────────────────────────

    /**
     * Default masked display — shows last 4 chars, masks the rest.
     * e.g. "1234567890" → "••••••7890"
     */
    public formatMasked(sValue: string): string {
        if (!sValue) return "";
        const sStr    = String(sValue);
        const iReveal = Math.min(4, Math.floor(sStr.length / 3));
        const sMask   = "•".repeat(sStr.length - iReveal);
        return sMask + sStr.slice(-iReveal);
    }

    public formatDate(sValue: string): string {
        if (!sValue) return "";
        const oDate = new Date(sValue);
        return oDate.toLocaleDateString("en-GB", {
            day:   "2-digit",
            month: "short",
            year:  "numeric"
        });
    }

    // ── Navigation ────────────────────────────────────────────────────────

    public onNavBack(): void {
        const sPreviousHash = History.getInstance().getPreviousHash();
        if (sPreviousHash !== undefined) {
            window.history.go(-1);
        } else {
            this.getOwnerComponent().getRouter().navTo("Report");
        }
    }

    public onEdit(): void {
        // Placeholder for future edit functionality
    }
}