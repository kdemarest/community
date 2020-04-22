Module.add('views',function() {

class ViewObserver {
	constructor() {
		this.observerDefault = null;
		this.observerOverride = null;
		this._dirty = true;
	}

	//
	// Observer Management
	//
	get observer() {
		return this.observerOverride || this.observerDefault;
	}
	get trueObserver() {
		return this.observerDefault;
	}
	override(observer) {
		this.observerOverride = observer;
	}

	//
	// Dirty management
	//
	set dirty(value) {
		this._dirty = value;
	}

	get dirty() {
		return this._dirty;
	}

	//
	// Message passing
	//
	message(msg,payload) {
		if( msg == 'observer' && payload !== this.observer ) {
			this.observerDefault = payload;
			if( this.onSetObserver ) {
				this.onSetObserver(payload);
			}
		}
	}

}

return {
	ViewObserver: ViewObserver,
}

});
