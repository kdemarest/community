Module.add( 'viewPanel', ()=>{

View.Showable = class extends View.Observer {
	constructor(divId) {
		super(divId);
		this.divId = divId;
	}
	get div() {
		return document.getElementById(this.divId);
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg == 'viewShow' ) {
			if( this.divId == payload ) {
				this.setVisible(true);
			}
			else {
				let myTier = Gui.panelTier[this.divId];
				let tier   = Gui.panelTier[payload];
				if( tier == myTier ) {
					this.setVisible(false);
				}
			}
			this.dirty = true;
		}
		if( msg == 'viewHide' ) {
			if( this.divId == payload ) {
				this.setVisible(false);
			}
			this.dirty = true;
		}
	}
}

View.Panel = class extends View.Showable {
	constructor(divId,makeComponentFn) {
		super(divId);
		this.panel = new Visual.Canvas( divId, makeComponentFn );
		this.lastDay = -1;
	}
	get community() {
		return this.observer.community;
	}
	setVisible(value) {
		this.panel.visible = value;
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg == 'dataDirty' ) {
			this.panel.data.update();
			this.dirty = true;
		}
	}
	tick(dt) {
this.dirty = true;

		this.panel.tick(dt);
	}
	render() {
		this.panel.render();
	}
}

View.Productivity = class extends View.Panel {
	constructor(divId,myDataFeed) {
		super( divId, root => {
			root.addData(		myDataFeed );
			root.addLayout(		new PanelProductivity.Layout(root) );
			root.addVisuals(	new PanelProductivity.Visuals(root) );
			root.addElements(	new PanelProductivity.Elements(root) );
		});
	}
}

View.Morale = class extends View.Panel {
	constructor(divId,myDataFeed) {
		super( divId, root => {
			root.addData(		myDataFeed );
			root.addLayout(		new PanelMorale.Layout(root) );
			root.addVisuals(	new PanelMorale.Visuals(root) );
			root.addElements(	new PanelMorale.Elements(root) );
			root.visible = false;
		});
	}
}

View.Wellbeing = class extends View.Panel {
	constructor(divId,myDataFeed) {
		super( divId, root => {
			root.addData(		myDataFeed );
			root.addLayout(		new PanelWellbeing.Layout(root) );
			root.addVisuals(	new PanelWellbeing.Visuals(root) );
			root.addElements(	new PanelWellbeing.Elements(root) );
			root.visible = false;
		});
	}
}

View.City = class extends View.Panel {
	constructor(divId,myDataFeed) {
		super( divId, root => {
			root.addData(		myDataFeed );
			root.addLayout(		new PanelCity.Layout(root) );
			root.addVisuals(	new PanelCity.Visuals(root) );
			root.addElements(	new PanelCity.Elements(root) );
			root.visible = true;
		});
	}
}

});
