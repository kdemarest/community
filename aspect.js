Module.add( 'aspect', ()=>{

let Aspect = {};

class Storage {
	constructor(community) {
		this.amount = 0;
		this._capacity = 0;
	}
	get capacity() {
		return this._capacity;
	}
	add(amount) {
		this.amount = Math.clamp( this.amount+amount, 0, this.capacity );
	}
	consume(amount) {
		let consumed = Math.min(this.amount,amount);
		this.amount -= consumed;
		return consumed;
	}
}

Aspect.Base = class {
	constructor(community,setup) {
		Object.assign( this, setup );
		console.assert( this.id );
		this.isAspect  = true;
		this.community = community;
	}
	init() {
	}
	tickDayBegin() {
	}
	tickDayEnd() {
	}
	onResourceProduced(amount) {
	}
	onResourceConsumed(amount) {
	}
	generateEvents() {
	}
	get production() {
		return this.community.productionForAspect( this.id );
	}
	get productivity() {
		return this.production / this.community.population;
	}
	eventAdd(event) {
		return this.community.eventList.add(event);
	}
}

Aspect.Food = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup)
		this.silos = new Storage();
		this.pendingInTheFields		= 0;
		this.daysGrown				= 0;
		this.harvestPeriod			= 30;
	}
	init() {
		// I think we need to assume that a certain amount of this is kept in people's houses
		// And we need to consider drying techniques and so on. Some food will last much longer
		// than others...
		this.silos._capacity = this.community.population * 14;
		this.silos.add( this.silos.capacity * 0.5 );
	}
	get storageDays() {
		return Math.floor(this.silos.amount / this.community.population);
	}
	generateEvents() {
		++this.daysGrown;
		if( this.daysGrown > this.harvestPeriod ) {
			this.eventAdd( new Aspect.Event({
				description: 'harvest of '+this.pendingInTheFields+' crops',
				actionFirst: (self) => {
					let kept = this.silos.add( this.pendingInTheFields );
					tell( 'Harvest stored '+kept+' of '+this.pendingInTheFields+' harvested.' );
					this.pendingInTheFields = 0;
					self.destroy();
				}
			}));
			this.daysGrown = 0;
		}
	}
	onResourceProduced(amount) {
		this.pendingInTheFields += amount;
	}
	onResourceConsumed(amount) {
		return this.silos.consume(amount);
	}
}

Aspect.Water = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup);
		this.cisterns = new class extends Storage {
			get capacity() { return community.householdList.bedCapacity + this.builtCapacity; }
		}();
		this.waterSourceActive = true;
		this.cisterns.active = true;
	}
	init() {
		// Every household is assumed to be able to store a day's water per bed
		this.cisterns.builtCapacity = this.community.population * 3;
		this.cisterns.add( this.cisterns.capacity );
	}
	get storageDays() {
		return Math.floor(this.cisterns.amount / this.community.population);
	}
	onResourceProduced(amount) {
		if( this.waterSourceActive && this.cisterns.active ) {
			this.cisterns.add( amount );
		}
	}
	onResourceConsumed(amount) {
		let consumed = Math.min( this.cisterns.amount, amount );
		this.cisterns.amount -= consumed;
		return consumed;
	}
}

Aspect.Sleep = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup);
	}
	get percentOperational() {
		return this.production / this.community.population;
	}
	get production() {
		let beds = this.community.householdList.sum( household => household.bedsAvailable );
		return beds;
	}
}

Aspect.Leisure = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup);
	}
}

Aspect.Health = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup);
		this.dailyEffort = new Storage();
		this.dailyEffort._capacity = 99999999;
	}
	tickDayBegin() {
		this.dailyEffort.amount = 0;
	}
	onResourceProduced(amount,person) {
		// We should check the person. If they are a medic, then they only heal wounds.
		// The would help guards preferentially, but not exclusively.
		this.dailyEffort.add(amount);
	}
	onResourceConsumed(amount) {
		return this.dailyEffort.consume(amount);
	}
}

Aspect.Gear = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup);
		this.gearCache = new Storage();
	}
	init() {
		this.gearCache._capacity = this.community.population;
	}
	onResourceProduced(amount) {
		this.gearCache.add( amount );
	}
	get percentOperational() {
		let gearCount = this.community.personList.sum( person => person.statGet('gear') > 0 );
		return gearCount / this.community.population;
	}
}

Aspect.Venue = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup);
		this.dailyEffort = new Storage();
		this.dailyEffort._capacity = 99999999;
	}
	tickDayBegin() {
		this.dailyEffort.amount = 0;
	}
	onResourceProduced(amount,person) {
		// We should check the person. If they are a medic, then they only heal wounds.
		// The would help guards preferentially, but not exclusively.
		this.dailyEffort.add(amount);
	}
	onResourceConsumed(amount) {
		return this.dailyEffort.consume(amount);
	}
	get percentOperational() {
//		this.community.venueList.traverse( venue => console.log(venue.isOperational ? venue.workerCapacity : 0,venue.id ) );
		let venueCount = this.community.venueList.sum( venue => venue.isOperational ? venue.workerCapacity : 0 );
		return venueCount / this.community.population;
	}
}

Aspect.Leadership = class extends Aspect.Base {
	get production() {
		// Someday give 50% weight to the ruler, and only 50% to all other servitors
		return super.production();
	}
}

Aspect.Children = class extends Aspect.Base {
}

class Bonus {
	constructor(name,bonusFn) {
		this.name = name;
		this.bonusFn = bonusFn;
	}
}

Aspect.Wisdom = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup);
		this.bonusList = new ListManager;
	}
	init() {
		// Just for testing.
//		this.bonusList.add( new Bonus(
//			'magicHat',
//			(jobType) => jobType.id=='entertainment' ? 0.5 : 0.0
//		));
	}
	getBonus(jobType) {
		return this.bonusList.sum( bonus => bonus.bonusFn.call(bonus,jobType) );
	}
}

class AspectHash extends HashManager {
	constructor() {
		super();
	}
}

return {
	Aspect: Aspect,
	AspectHash: AspectHash
}

});
