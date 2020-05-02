Module.add( 'habit', ()=>{

let Distance = {
	get: (dx,dy) => Math.sqrt(dx*dx+dy*dy),
	within: (dx,dy,dist) => (dx*dx)+(dy*dy) < dist*dist,
	squared: (dx,dy) => (dx*dx)+(dy*dy)
};

let Habit = {};

Habit.Glyphable = class {
	constructor(glyph,moreFunctions) {
		this.id = null;
		this.glyph = glyph;
		Object.assign( this, moreFunctions );
	}
}

Habit.GlyphableHash = class extends HashManager {
	add(typeId,type) {
		type.id = typeId;
		super.add(typeId,type);
	}
	getByGlyph(glyph) {
		return this.find( a => a.glyph == glyph );
	}
};


Habit.ActivityType = class extends Habit.Glyphable {
}

Habit.ActivityTypeHash = new class extends Habit.GlyphableHash {
	constructor() {
		super();
		this.add( 'sleep', new Habit.ActivityType('.') );
		this.add( 'rest',  new Habit.ActivityType('r') );
		this.add( 'eat',   new Habit.ActivityType('E') );
		this.add( 'work',  new Habit.ActivityType('W') );
	}
}

Habit.LocationType = class extends Habit.Glyphable {
}

Habit.LocationTypeHash = new class extends Habit.GlyphableHash {
	constructor() {
		super();
		this.add( 'home',	new Habit.LocationType( 'h', {
			getLocation: (habit) => {
				return habit.household.circle;
			}
		}));
		this.add( 'tavern',	new Habit.LocationType('t', {
			getLocation: (habit) => {
				let tavern = habit.venueNearestToHome('tavern');
				return (tavern || habit.household).circle;
			}
		}));
		this.add( 'work',   new Habit.LocationType('w', {
			getLocation: (habit) => {
				return habit.venue ? habit.venue.circle : habit.household.circle;
			}
		}));
	}
}

Habit.Manager = class {
	constructor(person) {
		this.person = person;
		//			  	  [0123456789te0123456789te]
		this.activity	= '......rEwwwwEwwwwwErrrr.';
		this.location	= 'hhhhhhhtwwwwtwwwwhhhhhhh';
		this.places = {};
	}
	get venue() {
		return this.person.venue || this.person.household;
	}
	get household() {
		return this.person.household;
	}
	venueNearestTo(origin,criteriaFn) {
		let closestDist2 = 9999*9999;
		let closestVenue = null;
		this.person.community.venueList.traverse( venue => {
			if( criteriaFn(venue) ) {
				let dist2 = Distance.squared(venue.circle.x-origin.x,venue.circle.y-origin.y);
				if( dist2 < Distance.squared(venue.circle.radius,0) ) {
					closestDist2 = dist2;
					closestVenue = venue;
				}
			}
		});
		return closestVenue;
	}

	venueNearestToHome(venueTypeId) {
		return this.venueNearestTo( this.household.circle, venue=>venue.type.id=='tavern' );
	}

	get x() {
		return this.person.circle.x;
	}

	get y() {
		return this.person.circle.y;
	}

	get radius() {
		return this.person.circle.radius;
	}

	get unitDistance() {
		return this.person.community.unitCircle.radius;
	}

	moveTo(x,y) {
		console.assert( Number.isFinite(x) && Number.isFinite(y) );
		this.person.circle.x = x;
		this.person.circle.y = y;
	}

	moveToPos(pos) {
		return this.moveTo(pos.x,pos.y);
	}

	moveDelta(dx,dy) {
		this.moveTo( this.person.circle.x+dx, this.person.circle.y+dy );
	}

	moveToward(pos,rate) {
		let dx = pos.x-this.x;
		let dy = pos.y-this.y;
		let len = Distance.get(dx,dy);
		dx = (dx / len) * this.unitDistance * rate;
		dy = (dy / len) * this.unitDistance * rate;
		this.moveDelta(dx,dy);
	}

	get clock() {
		return this.person.community.clock;
	}

	locationAt(hour) {
		let locationGlyph = this.location.substring(hour,hour+1);
		let locationType = Habit.LocationTypeHash.getByGlyph(locationGlyph);
		return locationType.getLocation(this);
	}

	get destination() {
		// give 10 minutes to get to your next location.
		let hour = this.clock.aheadMinutes(15).hour;
		return this.locationAt(hour);
	}

	get atDestination() {
		let d = this.destination;
		return Distance.within( d.x-this.x, d.y-this.y, d.radius );
	}

	tick(dt) {
		if( !this.everRun ) {
			this.moveToPos(this.destination);
			this.everRun = true;
			return;
		}
		if( !this.atDestination ) {
			let movementRatePerSecond = 0.001;
			this.moveToward(this.destination,dt*movementRatePerSecond);
			return;
		}
	}
};

return {
	Habit: Habit
}

});