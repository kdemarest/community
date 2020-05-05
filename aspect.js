Module.add( 'aspect', ()=>{

let Aspect = {};

let Bucket = {};

Bucket.Base = class {
	constructor() {
		this._amount = 0;
	}
	get amount() {
		return this._amount;
	}
	set amount(value) {
		console.assert( Number.isFinite(value) );
		this._amount = value;
	}
	get isBucket() {
		return true;
	}
	conduit(fn) {
		this.conduitFn = fn;
		return this;
	}
	_consume(amount) {
		console.assert( Number.isFinite(amount) );
		let consumed = Math.min(this.amount,amount);
		this.amount -= consumed;
		console.assert( Number.isFinite(consumed) );
		return consumed;
	}
}

Bucket.Storage = class extends Bucket.Base {
	constructor(capacity,fullness) {
		super();
		console.assert( Number.isFinite(capacity) && Number.isFinite(fullness) );
		this._capacity = capacity;
		this.amount = capacity * fullness;
	}
	get gap() {
		return 	this.capacity - this.amount;
	}
	get capacity() {
		return this._capacity;
	}
	set capacity(capacity) {
		this._capacity = capacity;
		this.amount = Math.min( this.amount, capacity );
	}
	fillFrom(source) {
		let taken = source._consume(this.gap);
		this.onResourceProduced(taken);
	}
	onResourceProduced(amount) {
		console.log( this.id+' stored '+amount );
		let oldAmount = this.amount;
		this.amount = Math.clamp( this.amount+amount, 0, this.capacity );
		return this.amount - oldAmount;	// how much was actually kept.
	}
	get consumptionPriority() {
		return 2;
	}
	consumeStorageSecond(amount) {
		return this._consume(amount);
	}
}

Bucket.Daily = class extends Bucket.Base {
	tickDayBegin() {
		this.amount = 0;
	}
	onResourceProduced(amount) {
		console.log( this.id+' readies '+amount );
		this.amount = this.amount + amount;
		return amount;	// how much was actually kept.
	}
	get consumptionPriority() {
		return 1;
	}
	consumeVolatilesFirst(amount) {
		return this._consume(amount);
	}
}

Bucket.PendingPeriodic = class extends Bucket.Base {
	constructor(period,releaseFn) {
		super();
		this.periodFn = typeof period == 'function' ? period : ()=>period;
		this.releaseFn = releaseFn;

		this.period = this.periodFn();
		this.dayCount = 0;
	}
	tickDayBegin() {
		this.dayCount += 1;
		if( this.amount > 0 && this.dayCount >= this.period ) {
			this.releaseFn(this);
			this.amount = 0;
			this.period = this.periodFn();
			this.dayCount = 0;
		}
	}
	onResourceProduced(amount) {
		this.amount = this.amount + amount;
		return amount;	// how much was actually kept.
	}
}

Bucket.PendingChance = class extends Bucket.Base {
	constructor(chance,variance,releaseFn) {
		super();
		this.chance = chance;
		this.variance = variance;
		this.releaseFn = releaseFn;
	}
	tickDayEnd() {
		if( this.amount > 0 && Math.random() < this.chance ) {
			this.releaseFn(this);
			this.amount = 0;
		}
	}
	onResourceProduced(amount) {
		this.amount = this.amount + ( amount * Math.rand(1-this.variance,1+this.variance) );
		return amount;	// how much was actually kept.
	}
}


Aspect.Base = class {
	constructor(community,setup) {
		Object.assign( this, setup );
		console.assert( this.id );
		this.isAspect  = true;
		this.community = community;
		this._bucketList = [];
	}
	init() {
	}
	initBuckets() {
		Object.each( this, (bucket,id) => {
			if( bucket instanceof Bucket.Base ) {
				this._bucketList.push(bucket);
				bucket.id = id;
			}
		});
	}
	traverse( fn ) {
		return this._bucketList.forEach( fn );
	}
	tickDayBegin() {
		this.traverse( bucket => bucket.tickDayBegin ? bucket.tickDayBegin() : null );
	}
	tickDayEnd() {
		this.traverse( bucket => bucket.tickDayEnd ? bucket.tickDayEnd() : null );
	}
	onResourceProduced(amount,person) {
		console.assert( this._bucketList.length <= 1);	// You should provide routing for more than one bucket.
		this.traverse( bucket => bucket.onResourceProduced ? bucket.onResourceProduced(amount) : null );
	}
	onResourceConsumed(amount) {
		let totalConsumed = 0;
		let consumeFn = (bucket,functionName) => {
		 	if( bucket[functionName] ) {
				let consumed = bucket[functionName](amount);
				amount -= consumed;
				totalConsumed += consumed;
			}
		}
		this.traverse( bucket => consumeFn( bucket, 'consumeVolatilesFirst' ) );
		this.traverse( bucket => consumeFn( bucket, 'consumeStorageSecond' ) );
		return totalConsumed;
	}
	generateSituations() {
	}
	toDays(amount) {
		let n = amount/this.population;
		if( n >= 1 || Math.floor(n)===n ) {
			return ''+Math.floor(n);
		}
		if( amount == 0 ) {
			return '0';
		}

		let stem = Math.floor(n);
		let fifths = ['\u2155','\u2155','\u2156','\u2157','\u2158']
		let f = Math.floor( (n-stem)*5 );
		return (stem===0 ? '' : ''+stem)+fifths[f];
	}
	get population() {
		return this.community.population;
	}
	get production() {
		return this.community.productionForAspect( this.id );
	}
	get productivity() {
		return this.production / this.community.population;
	}
	situationAdd(situation) {
		return this.community.situationList.add(situation);
	}
}

Aspect.Food = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup)
		/*
			farm	- every 30
			pasture - every 5 days
			hunting	- every day 50% chance for double yield
			foodCaravan - arrives every 15-20 days with that much food
			garden	- daily
			grocery	- daily, but really it doesn't produce food in just distributes it
		*/
		let caravanPeriod = () => Math.randInt(10,20);
		let pop = this.community.population;
		console.assert(pop);

		this.silos		= new Bucket.Storage(14*pop,0.5);
		this.farm		= new Bucket.PendingPeriodic( 30, b=>this.store(b.amount,'The harvest') );
		this.pasture	= new Bucket.PendingPeriodic(  5, b=>this.store(b.amount,'Pastured animals') );
		this.hunting	= new Bucket.PendingChance( 0.10, 0.0, b=>this.store(b.amount,'Hunters') );
		this.fishing	= new Bucket.PendingChance( 0.70, 0.0, b=>this.store(b.amount,'Fishers') );
		this.foodCaravan= new Bucket.PendingPeriodic( caravanPeriod, b=>this.store(b.amount,'A caravan') );
		this.garden		= new Bucket.Daily();
		this.grocery	= new Bucket.Daily();
	}
	get storageDays() {
		return this.toDays(this.silos.amount);
	}
	store(food,sourceDescription) {
		let amountActuallyKept = this.silos.onResourceProduced( food );
		guiMessage( 'situation', sourceDescription+' added '+this.toDays(food)+' food.' );
	}
	onResourceProduced(amount,person) {
		let bucketId = person.venue.type.id;
		console.assert( this[bucketId] && this[bucketId].isBucket );
		this[bucketId].onResourceProduced(amount,person);
	}
}

Aspect.Water = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup);
		let pop = this.community.population;
		this.pantries = new Bucket.Storage(1*pop,1.0);	// Must be first to be consumed first.
		this.cisterns = new Bucket.Storage(3*pop,1.0);
	}
	tickDayBegin() {
		// Pantries capacity is determines, and everyone restocks from cisterns.
		this.pantries.capacity = this.community.householdList.sum( household => household.bedsAvailable );
		this.pantries.fillFrom( this.cisterns );
	}
	get storageDays() {
		return this.toDays(this.cisterns.amount+this.pantries.amount);
	}
	onResourceConsumed(amount) {
		return super.onResourceConsumed( amount );
	}
	onResourceProduced(amount) {
		this.cisterns.onResourceProduced( amount );
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
		this.medicalHelp = new Bucket.Daily();
	}		
}

Aspect.Gear = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup);
		let pop = this.community.population;
		this.gearCache = new Bucket.Storage(1*pop,1.0);
	}
	get percentOperational() {
		let gearCount = this.community.personList.sum( person => person.statGet('gear') > 0 );
		return gearCount / this.community.population;
	}
}

Aspect.Venue = class extends Aspect.Base {
	constructor(community,setup) {
		super(community,setup);
		this.construction = new Bucket.Daily();
	}
	get percentOperational() {
//		this.community.venueList.traverse( venue => console.log(venue.isOperational ? venue.workerCapacity : 0,venue.id ) );
		let venueCount = this.community.venueList.sum( venue => venue.isOperational ? venue.workerCount : 0 );
		return venueCount / this.community.population;
	}
}

Aspect.Leadership = class extends Aspect.Base {
	get production() {
		// Someday give 50% weight to the ruler, and only 50% to all other servitors
		debugger;
		return super.production();
	}
}

Aspect.Family = class extends Aspect.Base {
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
