sap.ui.define([], function () {
  "use strict";

  var __exports = {
    name: "QUnit test suite for the UI5 Application: com.myorg.duplicatecheck",
    defaults: {
      page: "ui5://test-resources/com/myorg/duplicatecheck/Test.qunit.html?testsuite={suite}&test={name}",
      qunit: {
        version: 2
      },
      sinon: {
        version: 4
      },
      ui5: {
        language: "EN",
        theme: "sap_horizon"
      },
      coverage: {
        only: ["com/myorg/duplicatecheck/"],
        never: ["test-resources/com/myorg/duplicatecheck/"]
      },
      loader: {
        paths: {
          "com/myorg/duplicatecheck": "../"
        }
      }
    },
    tests: {
      "unit/unitTests": {
        title: "Unit tests for com.myorg.duplicatecheck"
      },
      "integration/opaTests": {
        title: "Integration tests for com.myorg.duplicatecheck"
      }
    }
  };
  return __exports;
});
//# sourceMappingURL=testsuite.qunit-dbg.js.map
