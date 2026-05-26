sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/UIComponent"], function (Controller, UIComponent) {
  "use strict";

  /**
   * @namespace com.myorg.duplicatecheck.controller
   */
  const Dashboard = Controller.extend("com.myorg.duplicatecheck.controller.Dashboard", {
    onInit: function _onInit() {
      // Dashboard initialization
    },
    /**
     * Navigate to Duplicate Check form
     * @public
     */
    onNavigateToDuplicateCheck: function _onNavigateToDuplicateCheck() {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.navTo("RouteMain");
    },
    /**
     * Navigate to Report tile
     * @public
     */
    onNavigateToReport: function _onNavigateToReport() {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.navTo("Report");
    }
  });
  return Dashboard;
});
//# sourceMappingURL=Dashboard-dbg.controller.js.map
