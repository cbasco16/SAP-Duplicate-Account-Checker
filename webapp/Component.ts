import UIComponent from "sap/ui/core/UIComponent";
import models from "./model/models";
import Device from "sap/ui/Device";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";

/**
 * @namespace com.myorg.duplicatecheck
 */
export default class Component extends UIComponent {
	public static metadata = {
		manifest: "json",
		interfaces: ["sap.ui.core.IAsyncContentCreation"]
	};

	private contentDensityClass: string;

	public init(): void {
		// call the base component's init function
		super.init();

		// create the device model
		this.setModel(models.createDeviceModel(), "device");

		// register persons OData V4 model if manifest didn't pick it up
		if (!this.getModel("persons")) {
			this.setModel(
				new ODataModel({
					serviceUrl: "/odata/v4/duplicate-check/",
					synchronizationMode: "None",
					operationMode: "Server",
					autoExpandSelect: true
				}),
				"persons"
			);
		}

		// create the views based on the url/hash
		this.getRouter().initialize();
	}

	public getContentDensityClass(): string {
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
	}

	public navigateToReport(): void {
		this.getRouter().navTo("report");
	}
}