import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";

/**
 * @namespace com.myorg.duplicatecheck.controller
 */
export default class Dashboard extends Controller {

	public onInit(): void {
		// Dashboard initialization
	}

	/**
	 * Navigate to Duplicate Check form
	 * @public
	 */
	public onNavigateToDuplicateCheck(): void {
		const oRouter = UIComponent.getRouterFor(this);
		oRouter.navTo("RouteMain");
	}

	/**
	 * Navigate to Report tile
	 * @public
	 */
	public onNavigateToReport(): void {
		const oRouter = UIComponent.getRouterFor(this);
		oRouter.navTo("Report");
	}
}