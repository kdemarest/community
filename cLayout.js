Module.add( 'cityLayout', ()=>{

let getDist		= (dx,dy) => Math.sqrt(dx*dx+dy*dy);
let withinDist	= (dx,dy,dist) => dx*dx+dy*dy < dist*dist;
let cast		= (cx,cy,rads,radius) => [cx+Math.cos(rads)*radius,cy+Math.sin(rads)*radius];
let clockPick	= (cx,cy,radius) => {
	console.assert( Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(radius) );
	let rads = Math.random()*2*Math.PI;
	let x = cx+Math.cos(rads)*(radius+0.00001);
	let y = cy+Math.sin(rads)*(radius+0.00001);
	console.assert( getDist(x-cx,y-cy) >= radius );
	return [x,y];
}

class Circle {
	constructor(id,x,y,radius) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.radius = radius;
		console.assert( Number.isFinite(this.x+this.y+this.radius) );
	}
	get isCircle() {
		return true;
	}
	moveBy(dx,dy) {
		this.x += dx;
		this.y += dy;
	}
	scaleBy(magnitude) {
		this.x *= magnitude;
		this.y *= magnitude;
		this.radius *= magnitude;
	}
	expandBy(magnitude) {
		this.x *= magnitude;
		this.y *= magnitude;
	}
}

class Cluster extends ListManager {
	constructor(id) {
		super();
		this.id = id;
		this.x = 0;
		this.y = 0;
		this.radius = 0;
	}
	process() {
		let xTotal = 0;
		let yTotal = 0;
		let radCount = 0;
		this.traverse( circle => {
			xTotal += circle.x * circle.radius;
			yTotal += circle.y * circle.radius;
			radCount += circle.radius;

		});
		this.x = xTotal / radCount;
		this.y = yTotal / radCount;

		if( Math.abs(this.x) < 0.00000001 ) this.x = 0;
		if( Math.abs(this.y) < 0.00000001 ) this.y = 0;

		if( this.length == 0 ) {
			this.radius = 0;
		}
		else
		if( this.length == 1 ) {
			this.radius = this.list[0].radius;
		}
		else {
			this.radius = 0;
			this.traverse( circle => {
				let dx = circle.x-this.x;
				let dy = circle.y-this.y;
				this.radius = Math.max( this.radius, getDist(dx,dy)+circle.radius );
			});
		}
	}
	add(circle) {
		super.add(circle);
		this.process();
	}
	moveBy(dx,dy) {
		this.x += dx;
		this.y += dy;
		this.traverse( circle => circle.moveBy(dx,dy) );
	}
	scaleBy(magnitude) {
		this.x *= magnitude;
		this.y *= magnitude;
		this.radius *= magnitude;
		this.traverse( circle => circle.scaleBy(magnitude) );
	}
	expandBy(magnitude) {
		this.x *= magnitude;
		this.y *= magnitude;
		this.traverse( circle => circle.expandBy(magnitude) );
		this.process();
	}
	findClosest(circle) {
		let best = this.radius * 10000;
		let found = null;
		this.traverse( c => {
			let d = getDist(c.x-circle.x,c.y-circle.y);
			if( d < best ) {
				best = d;
				found = c;
			}
		});
		return found;
	}

	collisionDetect(circle) {
		return this.filter( c => {
			if( c.id==circle.id ) {
				return;
			}
			let d = getDist( c.x-circle.x, c.y-circle.y );
			if( d==0 ) debugger;
			if( d < c.radius+circle.radius ) {
				//console.log('collide: '+String.coords(c.x,c.y)+'->'+String.coords(circle.x,circle.y)+'='+Math.fixed(d,3)+' < '+Math.fixed(c.radius,3)+'+'+Math.fixed(circle.radius,3));
			}
			return d < c.radius+circle.radius;
		});
//		return this.filter( c => withinDist( c.x-circle.x, c.y-circle.y, c.radius+circle.radius ) );
	}
	spinAbout(axis,circle,radStep) {
		let dx   = circle.x-axis.x;
		let dy	 = circle.y-axis.y;
		let dist = getDist(dx,dy);
		let rads = Math.atan2(dy,dx);
		console.assert( Math.abs(cast(axis.x,axis.y,rads,dist)[0]-circle.x) <0.001 && Math.abs(cast(axis.x,axis.y,rads,dist)[1]-circle.y) < 0.001 );
		let xOld,yOld;
		let collisionList;
		let repLimit = Math.floor(Math.PI*2/(radStep*0.95));
		do {
			rads += radStep;
			[xOld,yOld] = [circle.x,circle.y];
			[circle.x,circle.y] = cast(axis.x,axis.y,rads,dist);
			collisionList = this.collisionDetect(circle);
		} while( --repLimit && collisionList.length == 0 );
		//console.assert( repLimit );
		if( !repLimit ) {
			console.log('Endless spin for '+circle.id+' radius '+circle.radius);
		}
		console.assert( collisionList[0] !== axis );
		[circle.x,circle.y] = [xOld,yOld];
	}
	travelTo(xCenter,yCenter,circle,step=0.05) {
		console.assert( Number.isFinite(this.x) && Number.isFinite(this.y) && Number.isFinite(circle.x) && Number.isFinite(circle.y) );
		let dx = xCenter-circle.x;
		let dy = yCenter-circle.y;
		let dist = getDist(dx,dy);
		dx = dx * step; //(dx / dist) * step;
		dy = dy * step; //(dy / dist) * step;
		console.assert( Number.isFinite(dx) && Number.isFinite(dy) );
		let repLimit = Math.floor(1/step+2);
		let collisionList = null;
		do {
			circle.x += dx;
			circle.y += dy;
			collisionList = this.collisionDetect(circle);
		} while( --repLimit && collisionList.length == 0 );
		if( !repLimit ) {
			console.log('Endless travel for '+circle.id+' radius '+circle.radius);
		}
		//console.assert( repLimit );
		circle.x -= dx;
		circle.y -= dy;
		return collisionList;
	}
	findRandom(radius) {
		let circle = new Circle('TEMPORARY',0,0,radius);
		[circle.x,circle.y] = clockPick(this.x,this.y,this.radius+circle.radius);
		console.assert( this.collisionDetect(circle).length == 0 );
		if( this.length >0 ) {
			let collisionList = this.travelTo(this.x,this.y,circle,circle.radius*0.05);
			if( collisionList.length == 1 && this.length > 1 ) {
				this.spinAbout(collisionList[0],circle,Math.PI*2*0.01);
			}	
		}
		return circle;
	}
}

return {
	Circle: Circle,
	Cluster: Cluster
}

});
