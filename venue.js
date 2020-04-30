Module.add( 'venue', ()=> {

class Structure {
	constructor() {
		this.peopleDaysToBuild = 100;
		this.integrity = 1.0;	// always 0.0 - 1.0
		this.tileRadius = null;
		this.district = null;
		this.circle = null;
	}
	get condition() {
		return this.integrity;
	}
	repair( peopleDays ) {
		this.integrity = Math.clamp( this.integrity + peopleDays/this.peopleDaysToBuild, 0.0, 1.0 );
	}
	get needsRepair() {
		return this.integrity < 1.0;
	}
}

class Venue extends Structure {
	constructor( type, workerCapacity ) {
		super();
		console.assert( type && VenueTypeHash[type.id] && workerCapacity );
		Object.assign( this, type );
		this.isVenue	= true;
		this.type		= type;
		this.id			= type.id+'.'+Date.makeUid();
		this.workerCapacity	= workerCapacity;
		this.workerHash	= new HashManager();
		this.district  = null;
	}
	get preferredDistrictId() {
		return this.type.district;
	}
	get structureSize() {
		return this.workerCapacity*(this.type.tilesPerWorker||1)
	}
	get districtId() {
		console.assert(false);
	}

	get name() {
		let sizeName = ['small','medium','large','huge'][Math.min(3,Math.floor(Math.sqrt(1+this.workerCapacity))-1)];
		return sizeName+' '+this.type.id;
	}
	get text() {
		return this.name+' is '+Math.percent(this.percentWorkerCapacity)+'% worked by '+Array.joinAnd(this.workerNameArray)
	}
	get textSummary() {
		return this.name+' ('+this.workerCapacity+') makes '+this.type.produces.id;
	}
	get isOperational() {
		return !this.needsRepair;
	}
	get workerNameArray() {
		let nameList = [];
		this.workerHash.traverse( worker=>nameList.push(worker.name+' the '+worker.jobType.name) );
		return nameList;
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
	Structure: Structure
}

});
