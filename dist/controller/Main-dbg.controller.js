sap.ui.define(["./BaseController", "sap/m/MessageBox", "sap/m/MessageToast", "sap/ui/model/json/JSONModel", "sap/ui/core/UIComponent", "sap/ui/core/routing/History"], function (__BaseController, MessageBox, MessageToast, JSONModel, UIComponent, History) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  /**
   * @namespace com.myorg.duplicatecheck.controller
   */
  const Main = BaseController.extend("com.myorg.duplicatecheck.controller.Main", {
    onExit: function _onExit() {
      MessageBox.confirm("Are you sure you want to exit? Unsaved data will be lost.", {
        title: "Exit",
        onClose: action => {
          if (action === MessageBox.Action.OK) {
            window.history.back();
          }
        }
      });
    },
    onReset: function _onReset() {
      MessageBox.confirm("Are you sure you want to reset all fields?", {
        title: "Reset Form",
        onClose: action => {
          if (action === MessageBox.Action.OK) {
            this._clearAllFields();
          }
        }
      });
    },
    onValidate: function _onValidate() {
      const view = this.getView();
      if (!view) return;
      const requiredFields = [{
        id: "firstName",
        label: "First Name"
      }, {
        id: "lastName",
        label: "Last Name"
      }, {
        id: "email",
        label: "Email Address"
      }];
      const missingFields = [];
      requiredFields.forEach(({
        id,
        label
      }) => {
        const input = view.byId(id);
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
        MessageBox.warning(`Please complete the following required fields:\n\n• ${missingFields.join("\n• ")}`, {
          title: "Incomplete Information",
          actions: [MessageBox.Action.CLOSE]
        });
        return;
      }
      const formData = {
        firstName: view.byId("firstName").getValue(),
        lastName: view.byId("lastName").getValue(),
        companyName: view.byId("companyName").getValue(),
        email: view.byId("email").getValue(),
        phone: view.byId("phone").getValue(),
        street: view.byId("street").getValue(),
        postalCode: view.byId("postalCode").getValue(),
        city: view.byId("city").getValue(),
        region: view.byId("region").getValue(),
        country: view.byId("country").getValue(),
        taxNumber: view.byId("taxNumber").getValue(),
        bankHolderName: view.byId("bankHolderName").getValue(),
        bankAccountNumber: view.byId("bankAccountNumber").getValue(),
        bankName: view.byId("bankName").getValue()
      };
      this._checkDuplicates(formData);
    },
    _checkDuplicates: async function _checkDuplicates(formData) {
      await this._submitToCAP(formData, false);
    },
    _submitToCAP: async function _submitToCAP(formData, userConfirmed) {
      try {
        const payload = {
          ...formData,
          ...(userConfirmed && {
            _userConfirmed: true
          })
        };
        const response = await fetch("/odata/v4/duplicate-check/Persons", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          MessageToast.show("Record saved successfully.");
          const formModel = new JSONModel(formData);
          this.getOwnerComponent().setModel(formModel, "formModel");
          this.getOwnerComponent().getRouter().navTo("RouteValidation");
          return;
        }
        let errorBody = {};
        try {
          const raw = await response.json();
          const message = raw?.error?.message || "";
          errorBody = JSON.parse(message);
        } catch {
          MessageBox.error("An unexpected error occurred.", {
            title: "Error"
          });
          return;
        }
        const {
          type,
          score,
          reason,
          matchedRecords,
          recommendations
        } = errorBody;
        if (type === "EXACT_DUPLICATE") {
          const fields = errorBody.fields;
          MessageBox.error(`This record cannot be saved.\n\nExact duplicate found on:\n• ${fields.join("\n• ")}\n\nPlease review your entries.`, {
            title: "Duplicate Record Blocked"
          });
        } else if (type === "AI_DUPLICATE") {
          MessageBox.error(`This record has been blocked.\n\nRisk Score: ${score}/100\n\nReason: ${reason}\n\n${recommendations}`, {
            title: "Duplicate Record Blocked"
          });
        } else if (type === "AI_WARN") {
          this._showWarnDialog(formData, score, reason, matchedRecords, recommendations);
        }
      } catch (error) {
        MessageBox.error("Could not connect to the server. Please ensure the CAP server is running.", {
          title: "Connection Error"
        });
      }
    },
    _showWarnDialog: function _showWarnDialog(formData, score, reason, matchedRecords, recommendations) {
      const matchedText = matchedRecords?.map(r => `• Record ID: ${r.id}\n  Fields: ${r.matchedFields?.join(", ")}\n  ${r.details}`).join("\n\n") || "No specific records identified.";
      MessageBox.warning(`A possible duplicate was detected.\n\n` + `Risk Score: ${score}/100\n\n` + `Reason: ${reason}\n\n` + `Matched Records:\n${matchedText}\n\n` + `Recommendation: ${recommendations}\n\n` + `Do you want to save this record anyway?`, {
        title: "⚠️ Possible Duplicate Detected",
        actions: ["Accept", "Reject"],
        emphasizedAction: "Reject",
        onClose: async action => {
          // ✅ On Accept — call confirmSave action instead of POST
          if (action === "Accept") {
            try {
              const response = await fetch("/odata/v4/duplicate-check/confirmSave", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
              });
              if (response.ok) {
                MessageToast.show("Record saved successfully.");
                const formModel = new JSONModel(formData);
                this.getOwnerComponent().setModel(formModel, "formModel");
                this.getOwnerComponent().getRouter().navTo("RouteValidation");
              } else {
                MessageBox.error("Failed to save record.", {
                  title: "Error"
                });
              }
            } catch (error) {
              MessageBox.error("Could not connect to the server.", {
                title: "Connection Error"
              });
            }
          } else {
            MessageToast.show("Record was not saved. Please review your entries.");
          }
        }
      });
    },
    _clearAllFields: function _clearAllFields() {
      const view = this.getView();
      if (!view) return;
      const inputIds = ["firstName", "lastName", "companyName", "email", "phone", "street", "postalCode", "city", "region", "country", "taxNumber", "bankHolderName", "bankAccountNumber", "bankName"];
      inputIds.forEach(id => {
        const input = view.byId(id);
        if (input) {
          input.setValue("");
          input.setValueState("None");
        }
      });
      MessageToast.show("All fields have been reset.");
    },
    /**
     * Handle back navigation
     * @public
     */
    onNavBack: function _onNavBack() {
      const oPreviousHash = History.getInstance().getPreviousHash();
      const oRouter = UIComponent.getRouterFor(this);
      if (oPreviousHash !== undefined) {
        window.history.back();
      } else {
        oRouter.navTo("Dashboard", {}, true);
      }
    }
  });
  return Main;
});
//# sourceMappingURL=Main-dbg.controller.js.map
