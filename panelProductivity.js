Module.add( 'panelProductivity', ()=>{

let PanelProductivity = {};


PanelProductivity.Layout = (function(root) {
	console.assert( root );

	let graphRect = () => {
		let xMargin = 0.05;
		let yMargin = 0.05;
		let wOuter = 0.95;
		let hOuter = 0.85;
		return {
			x: root.width*xMargin,
			y: root.height*((1-hOuter)+yMargin),
			width: root.width*(wOuter-xMargin*2),
			height: root.height*(hOuter-yMargin*2)
		}
	}
	let baseRect = () => {
		let g = graphRect();
		let top = (g.y+g.height)-(g.height*0.25);
		return {
			x: g.x,
			y: top,
			yMid: top + (root.height-top)*0.5,
			width: g.width*0.80,
			height: root.height-top
		}
	}

	let body = () => {
		let g = graphRect();
		let b = baseRect();
		let xSpan = b.width / 5;
		let ySpan = (g.height-b.height)*0.50;
		return {
			x: g.x,
			y: g.y,
			width: g.width,
			height: b.y-g.y,
			bottom: b.y,
			xSpan: xSpan,
			ySpan: ySpan,
			row: (rowIndex) => b.y-ySpan*rowIndex,
			col: (colIndex) => b.x + xSpan*(colIndex+0.5)
		}
	}

	this.xLegend = (e,colIndex,scale=1) => {
		e.x = body().col(colIndex);
		e.y = baseRect().yMid;
		e.scaleToWidth( Math.min(body().xSpan*0.70,baseRect().height) );
		e.scale *= scale;
		e.margin = 3;	// the border on hover is this wide.
	}

	this.line = (e,rowIndex) => {
		let b = body();
		e.x = b.x;
		e.y = b.row(rowIndex);
		e.ex = b.x+b.width;
		e.ey = e.y;
		return e;
	}

	this.title = (e) => {
		e.x = root.width * 0.5;
		e.y = graphRect().y * 0.5;
		e.textHeight = Math.floor(graphRect().y * 0.50);
	}

	this.yLegend = (e,rowIndex) => {
		e.xAnchor = 0;
		e.x = graphRect().x+graphRect().width + root.width*0.01;
		e.y = body().row(rowIndex)
		e.textHeight = root.height*0.07;
	}

	this.bar = (e,colIndex,xScale,floor,ceiling,useArrows=true) => {
		floor	= Math.max(0,floor);
		ceiling = Math.max(0,ceiling);
		let image		= !useArrows ? 'icons/vertBar.png' : floor==ceiling ? 'icons/vertBar.png' : floor < ceiling ? 'icons/arrowUp.png' : 'icons/arrowDn.png';
		let yFloor		= body().row(floor);
		let yCeiling	= body().row(ceiling);
		if( yFloor == yCeiling ) {
			yFloor -= 2;
			yCeiling += 2;
		}
		e.image = image;
		e.x = body().col(colIndex);
		e.y = Math.max( yFloor, yCeiling );
		e.xScale = (root.width * 0.05)/e.naturalWidth * xScale * 1.5;	// the 1.5 just makes em thicker
		e.yScale = Math.abs(yFloor-yCeiling)/e.naturalHeight;
		e.yAnchor = 1.0;
 	}
 	return this;
});

PanelProductivity.Visuals = function (root) {
	console.assert( root && root.layout && root.data );
	let layout = root.layout;
	let data   = root.data;

	// everything gets a layout fun, so...
	return {
		skill:		[ new Visual.Sprite('icons/skill.png'),		(v) => layout.xLegend(v,0) ],
		morale: 	[ new Visual.Sprite('icons/morale.png'),	(v) => { layout.xLegend(v,1,0.9); v.image=data.moraleIcon; } ],
		wellbeing:	[ new Visual.Sprite(null),					(v) => { layout.xLegend(v,2); v.image=data.wellbeingIcon; } ],
		gear:		[ new Visual.Sprite('icons/goods.png'),		(v) => layout.xLegend(v,3) ],
		household:	[ new Visual.Sprite('icons/venue.png'),		(v) => layout.xLegend(v,4) ],
		production:	[ new Visual.Sprite('icons/production.png'),(v) => layout.xLegend(v,5.2,1.3) ],

		L0:			[ new Visual.Line('white',2),	(v) => layout.line(v,0) ],
		L1:			[ new Visual.Line('gray',1),	(v) => layout.line(v,1) ],
		L2:			[ new Visual.Line('gray',1),	(v) => layout.line(v,2) ],

		title:		[ new Visual.Text('white','Production'), (v) => layout.title(v) ],

		yL0:		[ new Visual.Text('white','0x'), (v) => layout.yLegend(v,0) ],
		yL1:		[ new Visual.Text('white','1x'), (v) => layout.yLegend(v,1) ],
		yL2:		[ new Visual.Text('white','2x'), (v) => layout.yLegend(v,2) ],

		b0:			[ new Visual.Sprite(null), (v) => layout.bar(v,0,1, 0.0,data.totals(0) ) ],
		b1:			[ new Visual.Sprite(null), (v) => layout.bar(v,1,1, data.totals(0),data.totals(1) ) ],
		b2:			[ new Visual.Sprite(null), (v) => layout.bar(v,2,1, data.totals(1),data.totals(2) ) ],
		b3:			[ new Visual.Sprite(null), (v) => layout.bar(v,3,1, data.totals(2),data.totals(3) ) ],
		b4:			[ new Visual.Sprite(null), (v) => layout.bar(v,4,1, data.totals(3),data.totals(4) ) ],
		b5:			[ new Visual.Sprite(null), (v) => layout.bar(v,5.2,1.3, 0.0,data.totals(4), false) ]
	}
}

PanelProductivity.Elements = (function(root) {
	console.assert( root && root.visual && root.data );
	let visual	= root.visual;
	let data	= root.data;

	visual.skill.link('iconButton')
		.on('click',()=>{})
	;
	visual.morale.link('iconButton')
//		.on('click',()=> { this.panelKeep=!this.panelKeep; if( !this.panelKeep ) guiMessage('panelHide','panelMorale'); })
		.on('mouseover',()=>guiMessage('panelShow','panelMorale'))
//		.on('mouseout',()=>!this.panelKeep ? guiMessage('panelHide','panelMorale'):null)

	;
	visual.wellbeing.link('iconButton')
//		.on('click',()=>guiMessage('panelShow','panelWellbeing'))
		.on('mouseover',()=>guiMessage('panelShow','panelWellbeing'))
//		.on('mouseout',()=>guiMessage('panelHide','panelWellbeing'))
	;
	visual.gear.link('iconButton')
		.on('click',()=>{})
	;
	visual.household.link('iconButton')
		.on('click',()=>{})
	;
});


return {
	PanelProductivity: PanelProductivity
}

})
