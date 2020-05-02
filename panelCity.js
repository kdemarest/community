Module.add( 'panelCity', ()=>{

let PanelCity = {};

PanelCity.Layout = (function(root) {

	let sqrt2		= Math.sqrt(2);
	let yTitle		= 0.08;			// the title's bottom
	let yInfo		= 0.95;
	let yInfoSpan	= 0.05;
	let xClock		= 0.10;
	let yClock		= 0.10;

	let leastDim = ()=>Math.min(root.width,root.height);
	let w = (pct) => root.width*pct;
	let h = (pct) => root.height*pct;

	this.mapText = (v,xPct,yPct,hPct,text) => {
		v.x = w(xPct);
		v.y = h(yPct);
		v.textHeight = Math.floor(h(hPct * 0.90));
		v.text = text || v.text;
		v.color = 'cyan';
		v.backgroundFill = 'black';
		v.backgroundPadding = 3;
	}

	this.title = (v) => this.mapText(v,0.50,yTitle*0.5,yTitle,null);
	this.info  = (v,text) => this.mapText(v,0.50,yInfo,yInfoSpan,text);
	this.clock  = (v,text) => this.mapText(v,0.10,yTitle*0.5,yTitle,text);

	this.mapPos = (v,circle,center,zoom,visible) => {
		let dim = leastDim() * zoom;
		v.x = w(0.5) + circle.x * dim*0.5 + center.x;
		v.y = h(0.5) + circle.y * dim*0.5 + center.y;
		v.scaleToHeight((circle.radius*2*0.5/sqrt2)*dim);
		v.margin = 3;
		v.visible = visible;
	}

	this.structure = this.mapPos;
	this.person    = this.mapPos;

	this.mapCircle = (v,district,center,zoom,visible) => {
		let dim = leastDim() * zoom;
		v.x = w(0.5) + district.x * dim*0.5 + center.x;
		v.y = h(0.5) + district.y * dim*0.5 + center.y;
		v.fill = 'rgba(0,0,0,0)';
		v.radius = district.radius*dim / 2;
		v.visible = visible;
	}

	this.structureRadius = this.mapCircle;
	this.district		 = this.mapCircle;

	return this;
});

PanelCity.Visuals = function (root) {
	console.assert( root && root.layout && root.data );
	let layout = root.layout;
	let data   = root.data;

	// everything gets a layout fun, so...
	let visuals = {};

	data.structureTraverse( structure => {
		visuals[structure.id] = [ new Visual.Sprite('icons/'+structure.icon),	(v) => layout.structure(v,structure.circle,data.center,data.zoom) ];
	});

	data.structureTraverse( structure => {
		visuals[structure.id+'Radius'] = [ new Visual.Circle(),	(v) => layout.structureRadius(v,structure.circle,data.center,data.zoom,!data.structureRadiusHide) ];
	});

	data.district.traverse( district => {
		visuals[district.id] = [ new Visual.Circle(), (v) => layout.district(v,district,data.center,data.zoom,!data.districtHide) ];
	});

	data.person.traverse( person => {
		let icon	= person.icon;
		console.assert(icon);
		let holding	= person.iconHolding;
		visuals[person.id] = [ new Visual.Sprite(holding||icon), (v) => layout.person(v,person.circle,data.center,data.zoom,!data.personHide) ];
//		if( holding ) {
//			visuals[person.id+'Held'] = [ new Visual.Sprite(holding), (v) => layout.person(v,person.circle,data.center,data.zoom,!data.personHide) ];
//		}
	});

	visuals.clock = [ new Visual.Text('white',''), (v) => layout.clock(v,data.textClock) ];


	visuals.dayButton  = [ new Visual.Div('Day >>',0.90,0.10) ];
	visuals.hourButton = [ new Visual.Div('Hour >>',0.90,0.20) ];

	// Must be last to draw last.
	visuals.title	= [ new Visual.Text('white','Town Map'), (v) => layout.title(v) ];
//	visuals.info	= [ new Visual.Text('white',''), (v) => layout.info(v,data.info) ];
	visuals.info	= [ new Visual.Div('',0.0,0.90), (v)=>v.content = '<div class="mapInfo">'+data.info+'</div>' ];

	return visuals;
}
PanelCity.Elements = function(root) {
	console.assert( root && root.visual && root.data );
	let visual	= root.visual;
	let data	= root.data;

	let mouse = new class {
		constructor() {
			this.x = 0;
			this.y = 0;
			this.dragging = false;
		}
		dragStart(x,y) {
			this.x = x;
			this.y = y;
			this.dragging = true;
		}
	}();

	root.div.on('wheel', function(evt) {
		let dir = evt.deltaY;
		data.zoom = Math.clamp( data.zoom - evt.deltaY*0.01, 0.4, 6.0 );
		event.preventDefault();
	});

	root.div.on('mousedown', function(evt) {
		mouse.dragStart(evt.offsetX,evt.offsetY);
	});

	root.div.on('mousemove', function(evt) {
		if( !mouse.dragging ) {
			return;
		}
		let dx = evt.offsetX - mouse.x;
		let dy = evt.offsetY - mouse.y;
		root.pan(dx,dy);
		data.pan(dx,dy);
		mouse.x = evt.offsetX;
		mouse.y = evt.offsetY;
	});

	root.div.on('mouseup', function(evt) {
		mouse.dragging = false;
	});

	root.div.on('mouseout', ()=>{
		mouse.dragging = false;
	});

	visual.info.link('mapInfoCenter');

	visual.dayButton.link('genericButton')
		.on('click',()=>data.clock.advanceDays(1) )
	;

	visual.hourButton.link('genericButton')
		.on('click',()=>data.clock.advanceHours(1) )
	;

	data.structureTraverse( structure => {
		visual[structure.id].link('structureButton')
			.on('click',()=>{})
			.on('mouseover',()=>data.setInfo(structure.textSummary+' in '+structure.district.id))
			.on('mouseout',()=>data.setInfo(''))

	});

	data.person.traverse( person => {
		visual[person.id].link('personButton')
			.on('click',()=>{})
			.on('mouseover',()=>data.setInfo(person.textRole))
			.on('mouseout',()=>data.setInfo(''))

	});
}

return {
	PanelCity: PanelCity
}

});