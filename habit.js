Module.add( 'habit', ()=>{

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
	getById(id) {
		console.assert( id && this.hash[id] );
		return this.hash[id];
	}
};


Habit.ActivityType = class extends Habit.Glyphable {
	constructor(glyph,locationHash) {
		super(glyph);
		this.locationHash = locationHash;
		Object.each( this.locationHash, (value,locationId) => {
			console.assert( this.isValidLocation(locationId) );
		});
	}
	isValidLocation(locationId) {
		return Habit.LocationTypeHash.get(locationId);
	}
	pickLocationType() {
		let picker = new Pick.Table().scanKeys( this.locationHash );
		let locationId = picker.pick();
		console.assert( locationId );
		let locationType = Habit.LocationTypeHash.get( locationId );
		console.assert( locationType );
		return locationType;
	}
}

Habit.LocationType = class extends Habit.Glyphable {
}

Habit.LocationTypeHash = new class extends Habit.GlyphableHash {
	constructor() {
		super();
		this.add( 'home',	new Habit.LocationType('h', {
			getLocation: (habit) => {
				return habit.household.circle;
			}
		}));
		this.add( 'eatery',	new Habit.LocationType('t', {
			getLocation: (habit) => {
				let tavern = habit.venueNearestToHome('tavern');
				return (tavern || habit.household).circle;
			}
		}));
		this.add( 'shop',	new Habit.LocationType('s', {
			getLocation: (habit) => {
				let picker = habit.venuePicker( venue => 
					venue.type.isShop ? habit.distanceFrom(venue) : 0
				);
				return (picker.pickAllowEmpty() || habit.household).circle;
			}
		}));
		this.add( 'work',   new Habit.LocationType('w', {
			getLocation: (habit) => {
				return habit.venue ? habit.venue.circle : habit.household.circle;
			}
		}));
		this.add( 'visit',   new Habit.LocationType('w', {
			getLocation: (habit) => {
				return habit.venue ? habit.venue.circle : habit.household.circle;
			}
		}));
		this.add( 'entertainment',   new Habit.LocationType('w', {
			getLocation: (habit) => {
				let picker = habit.venuePicker( venue =>
					venue.produces.id=='entertainment' ? habit.distanceFrom(venue) : 0
				);
				return (picker.pickAllowEmpty() || habit.household).circle;
			}
		}));
		this.add( 'liquor',   new Habit.LocationType('w', {
			getLocation: (habit) => {
				let picker = habit.venuePicker( venue =>
					venue.type.servesLiquor ? habit.distanceFrom(venue) : 0
				);
				return (picker.pickAllowEmpty() || habit.household).circle;
			}
		}));
	}
}();

Habit.ActivityTypeHash = new class extends Habit.GlyphableHash {
	constructor() {
		super();
		this.add( 'sleep',		new Habit.ActivityType( '.', { home:1 }) );
		this.add( 'rest',		new Habit.ActivityType( 'r', { home:1, entertainment:1 }) );
		this.add( 'morning',	new Habit.ActivityType( 'm', { home:1 }) );
		this.add( 'shop',		new Habit.ActivityType( 's', { shop:1 }) );
		this.add( 'eat',		new Habit.ActivityType( 'E', { home:1, eatery:1 }) );
		this.add( 'work',		new Habit.ActivityType( 'w', { work:1 }) );
		this.add( 'visit',		new Habit.ActivityType( 'v', { visit:1 }) );
		this.add( 'drink',		new Habit.ActivityType( 'v', { liquor:1 }) );
	}
}();
/*
The next thing to do is go through all the different jobTypes and give them
sensible schedules. Farmers and fishers wake quite early and return early.
Blue collar spends time in tavern.
etc.
*/

Habit.Manager = class {
	constructor(person) {
		this.person = person;
		//			  	  [0123456789te0123456789te]
		this.activity	= person.jobType.activity || '......mEwwwwEswwwvEssrr.';
		this.places = {};
		this.destinationMemory = { hour: null, location: null };
	}
	get venue() {
		return this.person.venue || this.person.household;
	}
	get household() {
		return this.person.household;
	}
	distanceFrom(venue) {
		return Distance.get(venue.circle.x-this.person.circle.x,venue.circle.y-this.person.circle.y);
	}
	venuePicker(fn) {
		return new Pick.Table().scanArray( this.person.community.venueList.list, fn );
	}
	venueNearestTo(origin,criteriaFn) {
		let closestDist2 = 9999*9999;
		let closestVenue = null;
		this.person.community.venueList.traverse( venue => {
			if( criteriaFn(venue) ) {
				let dist2 = Distance.squared(venue.circle.x-origin.x,venue.circle.y-origin.y);
				if( dist2 < closestDist2 ) {
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
		let temp;
		if( this.destinationMemory.hour !== hour ) {
			let activityGlyph	= this.activity.substring(hour,hour+1);
			temp = activityGlyph;
			console.assert( activityGlyph && activityGlyph!==undefined);
			let activityType	= Habit.ActivityTypeHash.getByGlyph(activityGlyph); 
			console.assert( activityType );
			let locationType	= activityType.pickLocationType();
			console.assert( locationType );

			this.destinationMemory.hour = hour;
			this.destinationMemory.location = locationType.getLocation(this);
		}

		return this.destinationMemory.location;
	}

	get destination() {
		if( this.person.destination ) {
			return this.person.destination;
		}
		// give 10 minutes to get to your next location.
		let hour = this.clock.aheadMinutes(15).hour;
		return this.locationAt(hour);
	}

	get atDestination() {
		let d = this.destination;
		return Distance.within( d.x-this.x, d.y-this.y, (d.radius+this.radius) * 0.4 );
	}

	tick(dt) {
		if( this.person.noHabits ) {
			return;
		}
		if( !this.everRun ) {
			let d = this.destination;
			let pos = {x:0,y:0};
			[pos.x,pos.y] = Distance.clockPick(d.x,d.y,d.radius);
			this.moveToPos(pos);
			this.everRun = true;
			return;
		}
		if( !this.atDestination ) {
			let movementRatePerSecond = 0.003;
			this.moveToward(this.destination,dt*movementRatePerSecond);
			return;
		}
	}
};

return {
	Habit: Habit
}

});