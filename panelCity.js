Module.add( 'panelCity', ()=>{

let PanelCity = {};

PanelCity.Layout = (function(root) {

	let sqrt2		= Math.sqrt(2);
	let yTitle		= 0.08;			// the title's bottom
	let yInfo		= 0.95;
	let yInfoSpan	= 0.05;

	let leastDim = ()=>Math.min(root.width,root.height);
	let w = (pct) => root.width*pct;
	let h = (pct) => root.height*pct;
	let coord = 

	this.title = (v) => {
		v.x = w(0.50);
		v.y = h(yTitle*0.5);
		v.textHeight = Math.floor(h(yTitle * 0.90));
	}

	this.info = (v,text) => {
		v.x = w(0.50);
		v.y = h(yInfo);
		v.textHeight = Math.floor(h(yInfoSpan * 0.90));
		v.text = text;
	}

	this.structure = (v,circle,center,zoom) => {
		let dim = leastDim() * zoom;
		v.x = w(0.5) + circle.x * dim*0.5 + center.x;
		v.y = h(0.5) + circle.y * dim*0.5 + center.y;
		v.scaleToHeight((circle.radius*2*0.5/sqrt2)*dim);
		v.margin = 3;
	}

	this.district = (v,district,center,zoom) => {
		let dim = leastDim() * zoom;
		v.x = w(0.5) + district.x * dim*0.5 + center.x;
		v.y = h(0.5) + district.y * dim*0.5 + center.y;
		v.fill = 'rgba(0,0,0,0)';
		v.radius = district.radius*dim / 2;
	}

	return this;
});

PanelCity.Visuals = function (root) {
	console.assert( root && root.layout && root.data );
	let layout = root.layout;
	let data   = root.data;

	// everything gets a layout fun, so...
	let visuals = {};

	visuals.title	= [ new Visual.Text('white','Town Map'), (v) => layout.title(v) ];
	visuals.info	= [ new Visual.Text('white',''), (v) => layout.info(v,data.info) ];

	data.structureTraverse( structure => {
		visuals[structure.id] = [ new Visual.Sprite('icons/'+structure.icon),	(v) => layout.structure(v,structure.circle,data.center,data.zoom) ];
	});

	data.district.traverse( district => {
		visuals[district.id] = [ new Visual.Circle(),	(v) => layout.district(v,district,data.center,data.zoom) ];
	});


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

	data.structureTraverse( structure => {
		visual[structure.id].link('iconButton')
			.on('click',()=>{})
			.on('mouseover',()=>data.setInfo(structure.textSummary+' in '+structure.district.id))
			.on('mouseout',()=>data.setInfo(''))

	});

//	data.traverse( wb => {
//		visual[wb.id].link('wellbeingPick',(v)=>root.layout.rowFootprint(v))
//			.on('click',()=>wb.value() -= 0.1)
//			.on('mouseover',()=>data.setInfo(wb,'hovering '+wb.id))
//			.on('mouseout',()=>data.setInfo(null))
//		;
//	});

}

return {
	PanelCity: PanelCity
}

});