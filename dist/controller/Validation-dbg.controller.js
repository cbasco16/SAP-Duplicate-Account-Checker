sap.ui.define(["./BaseController", "sap/m/MessageBox"], function (__BaseController, MessageBox) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  /**
   * @namespace com.myorg.duplicatecheck.controller
   */
  const Validation = BaseController.extend("com.myorg.duplicatecheck.controller.Validation", {
    onInit: function _onInit() {
      // formModel is already set by Main controller
    },
    onNavBack: function _onNavBack() {
      this.getOwnerComponent().getRouter().navTo("RouteMain");
    },
    onSubmit: async function _onSubmit() {
      const formModel = this.getOwnerComponent().getModel("formModel");
      const formData = formModel.getData();
      try {
        const response = await fetch("/odata/v4/duplicate-check/Persons", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          // Successfully saved
          const saved = await response.json();
          const score = saved.aiScore || 100;
          const warning = saved.aiWarning;
          if (warning) {
            MessageBox.warning(`Record saved, but AI detected a possible similarity:\n\n"${warning}"\n\nSimilarity Score: ${score}/100`, {
              title: "Saved with Warning",
              onClose: () => {
                this.getOwnerComponent().getRouter().navTo("RouteMain");
              }
            });
          } else {
            MessageBox.success(`Record saved successfully!\n\nAI Uniqueness Score: ${score}/100`, {
              title: "Success",
              onClose: () => {
                this.getOwnerComponent().getRouter().navTo("RouteMain");
              }
            });
          }
        } else {
          // Error response from CAP
          const errorResponse = await response.json();
          let errorData = {
            type: "UNKNOWN",
            fields: [],
            score: 0,
            reason: errorResponse.error?.message || "Unknown error",
            recommendations: "Please review your entries."
          };

          // Try to parse the CAP error message as JSON
          try {
            const parsed = JSON.parse(errorResponse.error?.message);
            errorData = {
              ...errorData,
              ...parsed
            };
          } catch {
            // message was plain text, keep default
          }
          if (errorData.type === "AI_DUPLICATE") {
            MessageBox.error(`AI detected a likely duplicate record.\n\n` + `Score: ${errorData.score}/100\n` + `Reason: ${errorData.reason}\n\n` + `Recommendation: ${errorData.recommendations}`, {
              title: "Duplicate Detected (AI)"
            });
          } else if (errorData.type === "EXACT_DUPLICATE") {
            MessageBox.error(`An exact duplicate was found on:\n\n• ${errorData.fields?.join("\n• ")}`, {
              title: "Exact Duplicate Detected"
            });
          } else {
            MessageBox.error(`Failed to save record:\n\n${errorData.reason}`, {
              title: "Error"
            });
          }
        }
      } catch (error) {
        MessageBox.error("Could not connect to the database.\nPlease ensure the CAP server is running on port 4004.", {
          title: "Connection Error"
        });
      }
    }
  });
  return Validation;
});
//# sourceMappingURL=Validation-dbg.controller.js.map
