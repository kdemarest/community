Module.add( 'utilMarkup', ()=>{

class Markup {
	constructor(div,onAnchorFn) {
		this.eventListenerList = [];
		this.div = (div instanceof Node) ? div : document.getElementById(div);
		this.onAnchorFn = onAnchorFn;
		console.assert( this.div instanceof Node );
	}
	convenient() {
		return [
			this.anchor.bind(this),
			this.finish.bind(this)
//			(data,text)=>this.anchor(data,text),
//			()=>this.finish()
		];
	}
	anchor(data,text) {
		let id = data.id+'-'+Date.makeUid();
		let typeName = data.constructor.name;
		let s = '<a id="'+id+'" class="'+typeName+'">'+text+'</a>';
		this.onAnchorFn(data).forEach( listener => {
			listener.id = id;
			this.eventListenerList.push(listener);
		});
		return s;
	}
	finish(innerHtml) {
		this.div.innerHTML = innerHtml;
		this.eventListenerList.forEach( listener => {
			let elementList = listener.id ? [document.getElementById(listener.id)] : document.getElementsByClassName(listener.className);
			console.assert( elementList && elementList.length );
			elementList.forEach( element => element.on(listener.on,listener.action) );
		});
	}
}

return {
	Markup: Markup
}
});
