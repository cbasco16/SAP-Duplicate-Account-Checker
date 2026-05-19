sap.ui.define(["./BaseController", "sap/m/MessageBox", "sap/m/MessageToast", "sap/ui/model/json/JSONModel"], function (__BaseController, MessageBox, MessageToast, JSONModel) {
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

      // Collect all field values
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

      // Check for duplicates via CAP before navigating
      this._checkDuplicates(formData);
    },
    _checkDuplicates: async function _checkDuplicates(formData) {
      try {
        const response = await fetch(`/odata/v4/duplicate-check/Persons?$filter=email eq '${formData.email}' or taxNumber eq '${formData.taxNumber}' or bankAccountNumber eq '${formData.bankAccountNumber}'`);
        const result = await response.json();
        if (result.value && result.value.length > 0) {
          // Duplicates found
          const duplicate = result.value[0];
          const matches = [];
          if (duplicate.email === formData.email) matches.push("Email Address");
          if (duplicate.taxNumber === formData.taxNumber && formData.taxNumber) matches.push("Tax Number");
          if (duplicate.bankAccountNumber === formData.bankAccountNumber && formData.bankAccountNumber) matches.push("Bank Account Number");
          MessageBox.warning(`A duplicate record was found matching:\n\n• ${matches.join("\n• ")}\n\nPlease review your entries.`, {
            title: "Duplicate Detected"
          });
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
    }
  });
  return Main;
});
//# sourceMappingURL=Main-dbg.controller.js.map
