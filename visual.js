Module.add( 'visual', () => {

let ImgCache = {};
Node.prototype.on = function(...args) {
	console.assert(typeof args[0] === 'string');
	let fn = args[1];
	let groupId;
	if( typeof fn === 'string' ) {
		fn = args[2];
		groupId = 'group_'+args[1];
		this[groupId] = this[groupId] || [];
	}
	let handler = Node.prototype.addEventListener.call(this,args[0],fn);
	if( groupId ) {
		this[groupId].push({ type:args[0], handler: handler });
	}
	return this;
}

Node.prototype.off = function(...args) {
	console.assert(typeof args[0] === 'string');
	let groupId = 'group_'+args[0];
	if( !this[groupId] ) {
		return;
	}
	this[groupId].forEach( entry => {
		Node.prototype.removeEventListener.call(this,entry.type,entry.handler);
	});
	delete this[groupId];
}



let ElementShadow = new class {
	constructor() {
		this.element = null;
	}
	set styleLeft(v)	{ this.element.style.left = v; }
	set styleTop(v)		{ this.element.style.top  = v; }
	set styleWidth(v)	{ Number.isFinite(v) ? (this.element.style.width = v) : null; }
	set styleHeight(v)	{ Number.isFinite(v) ? (this.element.style.height = v) : null; }
	set visibility(v)	{ this.element.style.visibility = v; }
	set zIndex(v)		{ this.element.style.zIndex = v; }
	set innerHTML(v)	{ this.element.innerHTML = v; }

	update(element) {
		this.element = element;

		Object.each( element.footprint, (value,key) => {
			if( value === element.footprintShadow[key] ) {
				return;
			}
			this[key] = value;
			element.footprintShadow[key] = value;
		});
	}
}

class Visual {
	constructor() {
		this.parent = null;
		this.x = 0;
		this.y = 0;
		this.layoutFn = null;
		this.footprintFn = null;
	}
	get root() {
		return this.parent || this;
	}
	get width() {
	}
	get height() {
	}
	add(visual) {
		console.assert(false);
	}
	defaultAdjustFootprint() {
		let margin = this.margin||0;
		Object.assign( this.element.footprint, {
			styleLeft: this.x-this.xAnchor*this.width-margin,
			styleTop: this.y-this.yAnchor*this.height-margin,
			styleWidth: this.width+margin*2,
			styleHeight: this.height+margin*2
		});
	}
	updateFootprint() {
		if( !this.element ) return;

		this.footprintFn ? this.footprintFn(this) : this.defaultAdjustFootprint();
		this.element.footprint.visible = this.visible!==false ? 'visible' : 'hidden';

		ElementShadow.update( this.element );
	}
	pan(dx,dy) {
		if( !this.element ) return;
		this.element.footprint.styleLeft	+= dx;
		this.element.footprint.styleTop		+= dy;
	}
	link(className,footprintFn) {
		return this.root.addElement(this,className,footprintFn);
	}
	on(eventId,fn) {
		return this.root.on(this.element,eventId,fn);
	}
	lay() {
		if( this.layoutFn ) {
			this.layoutFn(this);
		}
		this.updateFootprint();
	}
	tick(dt) {
	}
	render() {
	}
}

Visual.Line = class extends Visual {
	constructor(color,thickness=1) {
		super();
		this.color = color;
		this.thickness = thickness;
		this.dash = [];
	}
	render() {
		var ctx = this.root.context;
		ctx.beginPath();
		ctx.setLineDash(this.dash);
		ctx.strokeStyle = this.color;
		ctx.lineWidth	= this.thickness;
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(this.ex, this.ey);
		ctx.stroke();
		ctx.setLineDash([]);
		super.render();
	}
}

Visual.Blank = class extends Visual {
	constructor() {
		super();
		this._width  = 0;
		this._height = 0;
	}
	get width() {
		return this._width;
	}
	get height() {
		return this._height;
	}
}

Visual.Div = class extends Visual {
	constructor(content,xPct,yPct) {
		super();
		this._width  = 0;
		this._height = 0;
		this.xPct = xPct
		this.yPct = yPct;

		this.layoutFn = ()=>{};
		this.footprintFn = ()=>{
			Object.assign( this.element.footprint, {
				styleLeft: Math.floor(this.root.width * this.xPct),
				styleTop: Math.floor(this.root.height * this.yPct),
				zIndex: (this.root.overlay.style.zIndex||0)+1,
				innerHTML: this.element.footprint.innerHTML || content
			});
			content = null;
		}
	}
	set innerHTML(value) {
		this.element.footprint.innerHTML = value;
	}
	get width() {
		return this._width;
	}
	get height() {
		return this._height;
	}
}

Visual.Sprite = class extends Visual {
	constructor(imageUrl) {
		super();
		this._image = null;
		this.image = imageUrl;
		this.scale = 1.0;
		this.xScale = null;
		this.yScale = null;
		this.xAnchor = 0.5;
		this.yAnchor = 0.5;
		this.margin = 0;
		this.alpha = null;
	}
	set image(url) {
		if( url === null ) return;
		if( !url ) { debugger; }
		if( !ImgCache[url] ) {
			ImgCache[url] = new Image();
			ImgCache[url].src = url;
			ImgCache[url].onload = () => {
				ImgCache[url].loaded = true;
			}
		}
		this._image = ImgCache[url];
	}
	get image() {
		return this._image;
	}
	get loaded() {
		return this._image ? this._image.loaded : false;
	}
	get naturalWidth() {
		return this.loaded ? this.image.naturalWidth : 1.0;
	}
	get naturalHeight() {
		return this.loaded ? this.image.naturalHeight : 1.0;
	}
	get width() {
		return /*this.naturalWidth*/1*(this.xScale ? this.xScale : this.scale);
	}
	get height() {
		return /*this.naturalHeight*/1*(this.yScale ? this.yScale : this.scale);
	}
	scaleToWidth(w) {
		this.scale = w / /*this.naturalWidth*/1;
	}
	scaleToHeight(h) {
		if( this.image.loaded ) {
			this.scale = h / /*this.naturalHeight*/1;
		}
	}
	render() {
		if( this._image.loaded ) {
			let ctx = this.root.context;
			let alphaOld;
			if( Number.isFinite(this.alpha) ) {
				alphaOld = ctx.globalAlpha;
				ctx.globalAlpha = this.alpha;
			}
			ctx.drawImage(
				this.image,
				this.x-this.xAnchor*this.width,
				this.y-this.yAnchor*this.height,
				this.width,
				this.height
			);
			if( Number.isFinite(this.alpha) ) {
				ctx.globalAlpha = alphaOld;
			}
		}
		super.render();
	}
}

Visual.Text = class extends Visual {
	constructor(color,text) {
		super();
		this.color = color || 'white';
		this.text = text || '';
		this.xAnchor = 0.5;
		this.yAnchor = 0.5;
		this.textWidth = null
		this.textHeight = null;
	}
	setText(text) {
		this.text = text;
	}
	textWidthAt(px) {
		this.root.context.font = ''+px+'px Arial';
		return this.root.context.measureText(this.text).width;
	}
	get width() {
		return this.lastWidth;
	}
	get height() {
		return this.lastHeight;
	}
	render() {
		console.assert( this.textWidth!==null || this.textHeight!==null );

		let fontSize = Math.floor( this.textHeight ? this.textHeight : this.textWidthAt(100)/100*this.textWidth );
		this.lastHeight = fontSize;
		let w = this.textWidthAt(fontSize);
		let crazyAnchorOffset = -0.8;
		let tx = this.x-this.xAnchor*w;
		let ty = this.y-(this.yAnchor+crazyAnchorOffset)*fontSize;

		if( this.backgroundFill ) {
			let p = this.backgroundPadding || 0;
			this.root.context.fillStyle = this.backgroundFill;
			this.root.context.fillRect( tx-p, ty-fontSize-p, w+p*2, fontSize*1.286+p*2 );
		}

		this.root.context.fillStyle = this.color;
		this.root.context.strokeStyle = this.color;
		this.root.context.font = ''+fontSize+'px Arial';
		this.root.context.fillText( this.text, tx, ty );
		this.lastWidth = w;
		super.render();
	}
}

Visual.Circle = class extends Visual {
	constructor(color,fill,radius,thickness=1) {
		super();
		this.color  = color || 'white';
		this.fill	= fill || 'grey';
		this.radius  = radius;
		this.thickness = thickness;
	}
	render() {
		let ctx = this.root.context;

		ctx.fillStyle   = this.fill;
		ctx.strokeStyle = this.color;
		ctx.lineWidth	= this.thickness;

		ctx.beginPath();
		ctx.arc( this.x, this.y, this.radius, 0.0, Math.PI*2 );
		ctx.fill();
		ctx.stroke();
	}
}

Visual.Arc = class extends Visual {
	constructor(color,fill,inner,outer,start,end,thickness=1) {
		super();
		this.color  = color || 'white';
		this.fill	= fill || 'grey';
		this.inner  = inner;
		this.outer = outer;
		this.start  = start;
		this.end    = end;
		this.thickness = thickness;
	}
	render() {
		let pt = (radians,dist) => [ this.x+Math.cos(radians)*dist, this.y+Math.sin(radians)*dist ];

		let ctx = this.root.context;

		if( this.backgroundFill ) {
			ctx.fillStyle   = this.backgroundFill;
			ctx.strokeStyle = 'rgba(0,0,0,0)';
			ctx.beginPath();
			ctx.arc( this.x, this.y, this.outer, 0.0, Math.PI*2 );
			ctx.fill();
		}

		ctx.fillStyle   = this.fill;
		ctx.strokeStyle = this.color;
		ctx.lineWidth	= this.thickness;

		console.assert( this.start <= this.end );

		ctx.beginPath();
		let arcAmount = Math.abs(this.start-this.end);
		if( this.noLineOnEmptyAndFull && ( arcAmount >= Math.PI*2 || arcAmount <= 0) ) {
			ctx.strokeStyle = 'rgba(0,0,0,0)';
			ctx.arc( this.x, this.y, this.inner, this.start, this.end );
			ctx.arc( this.x, this.y, this.outer, this.start, this.end );
		}
		else {
			ctx.moveTo( ...pt(this.start,this.inner) );
			ctx.lineTo( ...pt(this.start,this.outer) );
			ctx.arc( this.x, this.y, this.outer, this.start, this.end );
			ctx.lineTo( ...pt(this.end,this.inner) );
			ctx.arc( this.x, this.y, this.inner, this.end, this.start, true );
		}
		ctx.fill();
		ctx.stroke();
	}
}


Visual.Canvas = class {
	constructor(rootDiv,makeComponentFn) {
		window.addEventListener('resize', () => {
			this.sizeToDiv();
		});

		this.visible = true;
		this.data		= null;
		this.layout		= null;
		this.element	= {};
		this.visual		= {};

		this.canvas  = document.createElement("canvas");                 // Create a <li> node
		this.canvas.style.position = 'absolute';
		this.context = this.canvas.getContext('2d');
		this.context.imageSmoothingEnabled = true;
		this.context.imageSmoothingQuality = 'high';

		this.overlay = document.createElement("div");
		this.overlay.style.position = 'absolute';
		this.overlay.style.overflowX = 'hidden';
		this.overlay.style.overflowY = 'hidden';

		let domOnTop = true;
		if( domOnTop ) {
			this.overlay.style.zIndex = (this.canvas.style.zIndex||0)+1;
		}
		else {
			this.canvas.style.zIndex = (this.overlay.style.zIndex||0)+1;
			this.canvas.style.pointerEvents = 'none';
		}


		this.div = document.getElementById(rootDiv);
		this.div.appendChild(this.canvas);
		this.div.insertBefore(this.overlay,this.canvas)

		makeComponentFn(this);

		this.sizeToDiv();
	}
	get pixelRatio() {
		var ctx = document.createElement('canvas').getContext('2d');
		let dpr = window.devicePixelRatio || 1;
		let bsr = ctx.webkitBackingStorePixelRatio ||
			ctx.mozBackingStorePixelRatio ||
			ctx.msBackingStorePixelRatio ||
			ctx.oBackingStorePixelRatio ||
			ctx.backingStorePixelRatio ||
			1;
		return dpr / bsr;
	}
	sizeToDiv() {
		let [w, h] = [this.div.clientWidth, this.div.clientHeight];
		this.canvas.width = w * this.pixelRatio;
		this.canvas.height = h * this.pixelRatio;
		this.canvas.style.height = h+'px';
		this.canvas.style.width  = w+'px';

		this.overlay.style.width = this.canvas.style.width;
		this.overlay.style.height = this.canvas.style.height;

		// Throw an incredibly weird wrinkle, this.context is wrong unless you gge the context yourself by hand.
	    this.canvas.getContext('2d').scale(this.pixelRatio, this.pixelRatio);
		this.lay();
	}
	get width() {
		return parseInt(this.canvas.style.width);
	}
	get height() {
		return parseInt(this.canvas.style.height);
	}
	addVisual(id,visual,layoutFn) {
		visual.id = id;
		visual.layoutFn = layoutFn || visual.layoutFn;
		this.visual[id] = visual;
		visual.parent = this;
		return visual;
	}
	addLayout(layout) {
		this.layout = layout;
	}
	addVisuals(visualHash) {
		Object.each( visualHash, (pair,id) => this.addVisual( id, pair[0], pair[1] ) );
	}
	addElements(elements) {
		// Intentionally empty. All elements associated with visuals are kept in the visual's class
	}
	addData(data) {
		this.data = data;
	}
	on(element,eventId,fn) {
		return element.on( eventId, fn );
	}
	addElement(visual,className,footprintFn) {
		let element = document.createElement("div");
		element.style.position = "absolute";
		element.footprint = {};
		element.footprintShadow = {};
		let classList = className.split(' ');
		classList.forEach( className => element.classList.add(className) );
		this.overlay.appendChild(element);
		this.element[visual.id] = element;
		visual.element			= element;
		visual.footprintFn		= footprintFn || visual.footprintFn;
		return element;
	}
	pan(dx,dy) {
		this.traverse( visual => visual.pan(dx,dy) );
	}
	traverse(fn) {
		Object.each( this.visual, fn );
	}
	lay() {
		this.traverse( visual => visual.lay() );
	}
	get isVisible() {
		return this.div.offsetParent !== null
	}
	tick(dt) {
		if( this.visible != this.isVisible ) {
			this.div.style.display = this.visible ? 'block' : 'none';
			this.data.update();
			this.sizeToDiv();
		}
		if( !this.visible ) {
			return;
		}


		this.traverse( visual => visual.tick(dt) );
		this.lay();
	}
	render() {
		this.context.clearRect(0,0,this.width,this.height);
		this.traverse( visual => visual.visible !== false ? visual.render() : null );		
	}
}

return {
	Visual: Visual
}

})
