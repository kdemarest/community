Module.add( 'venue', ()=> {

class Structure {
	constructor() {
		this.peopleDaysToBuild = 100;
		this.integrity = 1.0;	// always 0.0 - 1.0
		this.tileRadius = null;
		this.district = null;
		this.circle = null;
	}
	repair( peopleDays ) {
		this.integrity = Math.clamp( this.integrity + peopleDays/this.peopleDaysToBuild, 0.0, 1.0 );
	}
	get needsRepair() {
		return this.integrity < 1.0;
	}
}

class StructureHolder {
	constructor() {
		this.structure	= new Structure();
	}
	set circle(value) {
		console.assert( !this.isParasite );
		this.structure.circle = value;
	}
	get circle() {
		return this.structure.circle;
	}
	set tileRadius(value) {
		this.structure.tileRadius = value;
	}
	get tileRadius() {
		return this.structure.tileRadius;
	}
	get needsRepair() {
		return this.structure.needsRepair;
	}
}

class Venue extends StructureHolder {
	constructor( type, workerCapacity, directProduction ) {
		super();
		console.assert( type && VenueTypeHash[type.id] && workerCapacity );
		Object.assign( this, type );
		this.isVenue	= true;
		this.type		= type;
		this.id			= type.id+'.'+Date.makeUid();
		this.workerCapacity	= workerCapacity;
		this.directProduction = directProduction;
		this.workerHash	= new HashManager();
		this.district	= null;
		this.householdList	= [];
		this.text		= new Venue.Text(this);
	}
//-------------------------
	get preferredDistrictId() {
		return this.type.district;
	}
	get structureSize() {
		return Math.min( this.type.tilesMax || 9999, this.workerCapacity*(this.type.tilesPerWorker||1) );
	}
	get districtId() {
		console.assert(false);
	}
//-------------------------

	get isOperational() {
		return !this.structure.needsRepair;
	}
	get workerArray() {
		return Object.values(this.workerHash.hash);
	}
	workerAdd(person) {
		this.workerHash.hash[person.id] = person;
	}
	get workerCount() {
		return this.workerHash.count;
	}
	get percentWorkerCapacity() {
		return this.workerCount / this.workerCapacity;
	}
	get adequatelyStaffed() {
		return this.percentWorked >= 0.80;
	}
	get householdCount() {
		return this.householdList.length;
	}
	householdGet(index) {
		console.assert( index >= 0 && index < this.householdList.length );
		return this.householdList[index];
	}
	_addHousehold(household) {
		this.householdList.push(household);
	}
	produce(gatherFn) {
		if( !this.directProduction ) {
			return;
		}

		console.assert(gatherFn);
		gatherFn( this.type.produces.id, this.directProduction );
	}

}

Venue.Text = class {
	constructor(venue) {
		this.venue = venue;
	}
	get name() {
		let sizeName = ['small','medium','large','huge'][Math.min(3,Math.floor(Math.sqrt(1+this.venue.workerCapacity))-1)];
		return sizeName+' '+this.venue.type.id;
	}
	get text() {
		return this.name+' is '+Math.percent(this.venue.percentWorkerCapacity)+'% worked by '+Array.joinAnd(this.workerNameArray)
	}
	get workerNameArray() {
		let nameList = [];
		this.venue.workerHash.traverse( worker => 
			nameList.push(worker.text.name+' the '+worker.text.job)
		);
		return nameList;
	}
	get summary() {
		return this.name+' ('+this.venue.workerCapacity+') makes '+this.venue.type.produces.id;
	}

}

class VenueList extends ListManager {
	constructor() {
		super();
	}
	add(venue) {
		console.assert( venue.type.district );
		super.add(venue);
	}
	peopleServed(aspectTypeId) {
		let peopleSatisfied = this.sum( venue => venue.produces.id == aspectTypeId ? venue.workerCount : 0 );
		return peopleSatisfied;
	}
}

return {
	Venue: Venue,
	VenueList: VenueList,
	Structure: Structure,
	StructureHolder: StructureHolder
}

});
