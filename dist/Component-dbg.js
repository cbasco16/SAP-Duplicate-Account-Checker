sap.ui.define(["sap/ui/core/UIComponent", "./model/models", "sap/ui/Device", "sap/ui/model/odata/v4/ODataModel"], function (UIComponent, __models, Device, ODataModel) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const models = _interopRequireDefault(__models);
  /**
   * @namespace com.myorg.duplicatecheck
   */
  const Component = UIComponent.extend("com.myorg.duplicatecheck.Component", {
    metadata: {
      manifest: "json",
      interfaces: ["sap.ui.core.IAsyncContentCreation"]
    },
    init: function _init() {
      // call the base component's init function
      UIComponent.prototype.init.call(this);

      // create the device model
      this.setModel(models.createDeviceModel(), "device");

      // register persons OData V4 model if manifest didn't pick it up
      if (!this.getModel("persons")) {
        this.setModel(new ODataModel({
          serviceUrl: "/odata/v4/duplicate-check/",
          synchronizationMode: "None",
          operationMode: "Server",
          autoExpandSelect: true
        }), "persons");
      }

      // create the views based on the url/hash
      this.getRouter().initialize();
    },
    getContentDensityClass: function _getContentDensityClass() {
      if (this.contentDensityClass === undefined) {
        if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
          this.contentDensityClass = "";
        } else if (!Device.support.touch) {
          this.contentDensityClass = "sapUiSizeCompact";
        } else {
          this.contentDensityClass = "sapUiSizeCozy";
        }
      }
      return this.contentDensityClass;
    },
    navigateToReport: function _navigateToReport() {
      this.getRouter().navTo("report");
    }
  });
  return Component;
});
//# sourceMappingURL=Component-dbg.js.map
