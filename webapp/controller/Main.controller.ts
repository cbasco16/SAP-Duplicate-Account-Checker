import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import Input from "sap/m/Input";
import JSONModel from "sap/ui/model/json/JSONModel";

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

        // Collect all field values
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

        // Check for duplicates via CAP before navigating
        this._checkDuplicates(formData);
    }

    private async _checkDuplicates(formData: Record<string, string>): Promise<void> {
        try {
            const response = await fetch(
                `/odata/v4/duplicate-check/Persons?$filter=email eq '${formData.email}' or taxNumber eq '${formData.taxNumber}' or bankAccountNumber eq '${formData.bankAccountNumber}'`
            );

            const result = await response.json();

            if (result.value && result.value.length > 0) {
                // Duplicates found
                const duplicate = result.value[0];
                const matches: string[] = [];

                if (duplicate.email === formData.email) matches.push("Email Address");
                if (duplicate.taxNumber === formData.taxNumber && formData.taxNumber) matches.push("Tax Number");
                if (duplicate.bankAccountNumber === formData.bankAccountNumber && formData.bankAccountNumber) matches.push("Bank Account Number");

                MessageBox.warning(
                    `A duplicate record was found matching:\n\n• ${matches.join("\n• ")}\n\nPlease review your entries.`,
                    { title: "Duplicate Detected" }
                );
            } else {
                // No duplicates — pass data to Validation page
                const formModel = new JSONModel(formData);
                this.getOwnerComponent().setModel(formModel, "formModel");
                this.getOwnerComponent().getRouter().navTo("RouteValidation");
            }

        } catch (error) {
            MessageBox.error("Could not connect to the database. Please ensure the CAP server is running on port 4004.", {
                title: "Connection Error"
            });
        }
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
}