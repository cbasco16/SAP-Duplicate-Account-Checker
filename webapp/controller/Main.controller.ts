import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import Input from "sap/m/Input";
import JSONModel from "sap/ui/model/json/JSONModel";
import UIComponent from "sap/ui/core/UIComponent";
import History from "sap/ui/core/routing/History";

/**
 * @namespace com.myorg.duplicatecheck.controller
 */
export default class Main extends BaseController {

    public onExit(): void {
        MessageBox.confirm("Are you sure you want to exit? Unsaved data will be lost.", {
            title: "Exit",
            onClose: (action: string) => {
                if (action === MessageBox.Action.OK) {
                    window.history.back();
                }
            }
        });
    }

    public onReset(): void {
        MessageBox.confirm("Are you sure you want to reset all fields?", {
            title: "Reset Form",
            onClose: (action: string) => {
                if (action === MessageBox.Action.OK) {
                    this._clearAllFields();
                }
            }
        });
    }

    public onValidate(): void {
        const view = this.getView();
        if (!view) return;

        const requiredFields: { id: string; label: string }[] = [
            { id: "firstName", label: "First Name"    },
            { id: "lastName",  label: "Last Name"     },
            { id: "email",     label: "Email Address" }
        ];

        const missingFields: string[] = [];

        requiredFields.forEach(({ id, label }) => {
            const input = view.byId(id) as Input;
            if (!input) return;

            const value = input.getValue().trim();
            if (!value) {
                input.setValueState("Error");
                input.setValueStateText(`${label} is required.`);
                missingFields.push(label);
            } else {
                input.setValueState("Success");
                input.setValueStateText("");
            }
        });

        if (missingFields.length > 0) {
            MessageBox.warning(
                `Please complete the following required fields:\n\n• ${missingFields.join("\n• ")}`,
                {
                    title: "Incomplete Information",
                    actions: [MessageBox.Action.CLOSE]
                }
            );
            return;
        }

        const formData: Record<string, string> = {
            firstName:         (view.byId("firstName")         as Input).getValue(),
            lastName:          (view.byId("lastName")          as Input).getValue(),
            companyName:       (view.byId("companyName")       as Input).getValue(),
            email:             (view.byId("email")             as Input).getValue(),
            phone:             (view.byId("phone")             as Input).getValue(),
            street:            (view.byId("street")            as Input).getValue(),
            postalCode:        (view.byId("postalCode")        as Input).getValue(),
            city:              (view.byId("city")              as Input).getValue(),
            region:            (view.byId("region")            as Input).getValue(),
            country:           (view.byId("country")           as Input).getValue(),
            taxNumber:         (view.byId("taxNumber")         as Input).getValue(),
            bankHolderName:    (view.byId("bankHolderName")    as Input).getValue(),
            bankAccountNumber: (view.byId("bankAccountNumber") as Input).getValue(),
            bankName:          (view.byId("bankName")          as Input).getValue()
        };

        this._checkDuplicates(formData);
    }

    private async _checkDuplicates(formData: Record<string, string>): Promise<void> {
        await this._submitToCAP(formData, false);
    }

    private async _submitToCAP(formData: Record<string, string>, userConfirmed: boolean): Promise<void> {
        try {
            const payload = {
                ...formData,
                ...(userConfirmed && { _userConfirmed: true })
            };

            const response = await fetch("/odata/v4/duplicate-check/Persons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                MessageToast.show("Record saved successfully.");
                const formModel = new JSONModel(formData);
                this.getOwnerComponent().setModel(formModel, "formModel");
                this.getOwnerComponent().getRouter().navTo("RouteValidation");
                return;
            }

            let errorBody: any = {};
            try {
                const raw = await response.json();
                const message = raw?.error?.message || "";
                errorBody = JSON.parse(message);
            } catch {
                MessageBox.error("An unexpected error occurred.", { title: "Error" });
                return;
            }

            const { type, score, reason, matchedRecords, recommendations } = errorBody;

            if (type === "EXACT_DUPLICATE") {
                const fields = errorBody.fields as string[];
                MessageBox.error(
                    `This record cannot be saved.\n\nExact duplicate found on:\n• ${fields.join("\n• ")}\n\nPlease review your entries.`,
                    { title: "Duplicate Record Blocked" }
                );

            } else if (type === "AI_DUPLICATE") {
                MessageBox.error(
                    `This record has been blocked.\n\nRisk Score: ${score}/100\n\nReason: ${reason}\n\n${recommendations}`,
                    { title: "Duplicate Record Blocked" }
                );

            } else if (type === "AI_WARN") {
                this._showWarnDialog(formData, score, reason, matchedRecords, recommendations);
            }

        } catch (error) {
            MessageBox.error(
                "Could not connect to the server. Please ensure the CAP server is running.",
                { title: "Connection Error" }
            );
        }
    }

    private _showWarnDialog(
        formData: Record<string, string>,
        score: number,
        reason: string,
        matchedRecords: any[],
        recommendations: string
    ): void {
        const matchedText = matchedRecords?.map((r: any) =>
            `• Record ID: ${r.id}\n  Fields: ${r.matchedFields?.join(", ")}\n  ${r.details}`
        ).join("\n\n") || "No specific records identified.";

        MessageBox.warning(
            `A possible duplicate was detected.\n\n` +
            `Risk Score: ${score}/100\n\n` +
            `Reason: ${reason}\n\n` +
            `Matched Records:\n${matchedText}\n\n` +
            `Recommendation: ${recommendations}\n\n` +
            `Do you want to save this record anyway?`,
            {
                title: "⚠️ Possible Duplicate Detected",
                actions: ["Accept", "Reject"],
                emphasizedAction: "Reject",
                onClose: async (action: string) => {
                    // ✅ On Accept — call confirmSave action instead of POST
                    if (action === "Accept") {
                        try {
                            const response = await fetch("/odata/v4/duplicate-check/confirmSave", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(formData)
                            });
                            if (response.ok) {
                                MessageToast.show("Record saved successfully.");
                                const formModel = new JSONModel(formData);
                                this.getOwnerComponent().setModel(formModel, "formModel");
                                this.getOwnerComponent().getRouter().navTo("RouteValidation");
                            } else {
                                MessageBox.error("Failed to save record.", { title: "Error" });
                            }
                        } catch (error) {
                            MessageBox.error("Could not connect to the server.", { title: "Connection Error" });
                        }
                    } else {
                        MessageToast.show("Record was not saved. Please review your entries.");
                    }
                }
            }
        );
    }

    private _clearAllFields(): void {
        const view = this.getView();
        if (!view) return;

        const inputIds = [
            "firstName", "lastName", "companyName",
            "email", "phone",
            "street", "postalCode", "city", "region", "country",
            "taxNumber", "bankHolderName", "bankAccountNumber", "bankName"
        ];

        inputIds.forEach((id) => {
            const input = view.byId(id) as Input;
            if (input) {
                input.setValue("");
                input.setValueState("None");
            }
        });

        MessageToast.show("All fields have been reset.");
    }

    /**
     * Handle back navigation
     * @public
     */
    public onNavBack(): void {
        const oPreviousHash = History.getInstance().getPreviousHash();
        const oRouter = UIComponent.getRouterFor(this);

        if (oPreviousHash !== undefined) {
            window.history.back();
        } else {
            oRouter.navTo("Dashboard", {}, true);
        }
    }
}