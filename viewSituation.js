Module.add( 'viewSituation', ()=>{

View.Situation = class extends View.Observer {
	constructor(divId) {
		super();
		this.divId = divId;
	}
	get div() {
		return document.getElementById(this.divId);
	}
	message( msg, payload ) {
		super.message(...arguments);
		if( msg == 'situation' ) {
			let atBottom = this.div.scrollHeight - this.div.offsetHeight - this.div.scrollTop < 1;
			let textNode = document.createElement('div');
			textNode.innerHTML = payload;
			this.div.appendChild(textNode);
			if( atBottom ) {
				this.div.scrollTop = this.div.scrollHeight;
			}
		}
	}
}

});
