sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"planorg/de/kem/planorg/de/kem/HotOdata/libs/handsontable-master/dist/handsontable.full"
], function (Control, BusyIndicator, MessageToast, MessageBox) {
	"use strict";
	return Control.extend("planorg.de.kem.planorg.de.kem.HotOdata.Hot", {
		
		metadata : {
			properties: {
				"options": {
					type: "object",
					defaultValue: {}
				},
				"tabledata": {
					type: "object",
					bindable: "bindable"
				},
				"odata": {
					type: "string"
				}
			},
			aggregations: {},
			events: {
				hotinit: {
					parameters: {
						hot: {
							type: "object"
						}
					}
				}
			}
		},
		hot: null,
		columnsLength: 0,
		/*
		setTabledata: function(oData) {
			var bRender = false;
			if (this.hot) {
				bRender = true;
			}
			this.setProperty("tabledata", oData, bRender);
			return this;
		},
		*/
		/*
		getTabledata: function(oData) {
			var otableData = this.getProperty("tabledata", oData);
			return this;
		},
		*/
		
		getColHeaders: function(results) {
			var aColHeader = jQuery.extend({}, results[0]);;
			delete aColHeader.__metadata;
			aColHeader = Object.keys(aColHeader);
			return aColHeader;
		},
		
		getColumns: function(results) {
			var aColumns = this.getColHeaders(results),
				aColumnsOption = [];
			for (var i = 0; i < aColumns.length; i++) {
				aColumnsOption.push({data: aColumns[i]});
			}
			return aColumnsOption;
		},
		
		sGetPathFromRow: function(changes) {
			var aData = this.hot.getDataAtRow(changes[0]),
				sPath = aData[aData.length-1],
				aKey = sPath.split("/"),
				sKey = aKey[aKey.length-1];
			return '/' + sKey + '/' + changes[1];
		},
		
		editOData: function(changes) {
			var oModel = this.getBinding("tabledata").oModel,
				sPath = "",
				changedValue = "",
				bSuccess = false;
			for (var i = 0; i < changes.length; i++) {
				bSuccess = false;
				sPath = this.sGetPathFromRow(changes[i]);
				changedValue = changes[i][3];
				//bSuccess = oModel.setProperty(sPath, changedValue);
				bSuccess = true;
				console.log("Path: ", sPath, "Pending Changes: ", oModel.hasPendingChanges());
				if (bSuccess === true){
					console.log('setProperty success: ', oModel.getProperty(sPath));
					oModel.submitChanges({
						success: function(msg) {
							//console.log("hooooray", msg);
							var msg = "hooray:" + msg;
							jQuery.sap.log.debug(msg, undefined, "ExcelGrid");
						},
						error: function(msg) {
							//MessageToast.show(sMsg);
							console.log("MESSAGE:", msg);
						}
					});
				} else {
					console.log('setProperty failed');
				}
			}
			console.log(changes);
		},
		
		updateODataModel: function(changes, source) {
			console.log(changes, source);
			switch(source) {
			    case 'edit':
			        this.editOData(changes);
			        break;
			    default:
			        console.log('dont know what to do');
			}
		},
		
		newEntry: function(index, amount) {
			var sPath = this.getBinding("tabledata").oModel.createEntry(this.getBinding("tabledata").sPath).sPath;
			this.hot.setDataAtCell(index, this.columnsLength-1, sPath);
		},
		
		initHot: function(results) {
			var	container = this.getDomRef(),
				options = this.getOptions(),
				that = this;
			options.columns = this.getColumns(results);
			if (!options.colHeaders) {
				options.colHeaders = this.getColHeaders(results);
			}
			//preserve keys
			options.colHeaders.push("id");
			options.columns.push({data: '__metadata.id'});
			this.columnsLength = options.columns.length;
			options.data = results;
			window.setTimeout(function() {
				that.hot = new Handsontable(container, options);
				that.hot.addHook("afterChange", function(changes, source) {
					that.updateODataModel(changes, source);
				});
				that.hot.addHook("afterCreateRow", function(index, amount, source) {
					that.newEntry(index, amount, source);
				});
				that.fireEvent("hotinit", {
					hot: that.hot
				});
			}, 100);
		},
		
		getOModelData: function() {
			var that = this,
				oBinding = this.getBinding("tabledata");
				BusyIndicator.show();
			if (oBinding && ("sPath" in oBinding) && ("oModel" in oBinding)) {
				oBinding.oModel.read(oBinding.sPath, {
					urlParameters: {
	        			"$skip": 0,
	        			"$top": 2
	    			},
					success: function(oData, oResponse) {
						that.initHot(oData.results);
						BusyIndicator.hide();
					},
					error: function(oError) {
						BusyIndicator.hide();
						sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
					}
				});				
			} else {
				BusyIndicator.hide();
				jQuery.sap.log.error("Datamodel not found.", undefined, "Hot.getOModelData");
				return this;
			}
		},

		onAfterRendering: function() {
			this.getOModelData();
		},
		
		init : function () {
			var libraryPath = jQuery.sap.getModulePath("planorg.de.kem.planorg.de.kem.HotOdata");
			jQuery.sap.includeStyleSheet(libraryPath + "/libs/handsontable-master/dist/handsontable.full.css");
		},
		
		renderer : function (oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
			oRM.write(">");
			oRM.write("</div>");
		}
	});
});