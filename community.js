Module.add( 'community', ()=>{

class Community {
	constructor(culture) {
		this.isCommunity = true;
		this.isBuilt = false;
		this.id = Date.makeUid();
		this.culture = culture;
		this.personList		= new PersonList().setValidator( p=>p.isAlive );
		this.ancestorList	= new PersonList().setValidator( p=>p.isDead );
		this.venueList		= new VenueList().setValidator( v=>v.type.district );
		this.householdList	= new HouseholdList;
		this.situationList	= new ListManager;

		this.moraleDirty = true;
		this.dayTime = new Time.GameTime();

		this.communityBuilder = new CommunityBuilder(this)

	}

	initAspects() {
		this.aspectHash = new AspectHash;
		Object.each( AspectTypeHash, (aspectType,aspectTypeId) => {
			let aspectClassId = String.capitalize(aspectTypeId);
			let aspectClass = Aspect[aspectClassId] || Aspect.Base;
			let aspect = new aspectClass(this,aspectType);
			this.aspectHash.add( aspectTypeId, aspect );
			aspect.initBuckets();
		});
	}

	get structureList() {
		return new ListManager( this.venueList.list.concat( this.householdList.list ) );
	}

	structureTraverse(fn) {
		this.venueList.traverse(fn);
		this.householdList.traverse(fn);
	}

	get aspect() {
		return this.aspectHash.hash;
	}
	productionForAspect(aspectId) {
		let total = this.sum( person => person.productionForAspect(aspectId) );
		return total;
	}
	assignMoraleSurrogates() {
		// It is entirely possible that we don't have any explicit leader, or security, and
		// so on. That is especially true for small populations. In those cases, we must
		// make somebody the surrogate.
		if( !this.surrogateTable ) {
			this.surrogateTable = {
				family: {
					pickFn: ()=>this.personList.best( person => Math.abs(person.age-6) ),
					jobTypeId: 'child'
				},
				security: {
					pickFn: ()=>this.personList.best( person => Math.abs(person.age-32) ),
					jobTypeId: 'guard'
				},
				entertainment: {
					pickFn: ()=>this.personList.best( person => Math.abs(person.age-24) ),
					jobTypeId: 'bard'
				},
				leadership: {
					pickFn: ()=>this.personList.best( person => Math.abs(person.age-60) ),
					jobTypeId: 'ruler'
				}
			}
		}
		Object.each( this.surrogateTable, (row,aspectId) => {
			let total = this.personList.sum( person => person.moraleForAspect(aspectId) );
			if( total == 0 ) {
				let person = row.pickFn();
				person.setSurrogate( JobTypeHash[row.jobTypeId] );
			}
		});
	}
	moraleForAspect(aspectId) {
		if( !this.moraleContribution ) {
			let total =
				this.aspect.leadership.workerImpact +
				this.aspect.entertainment.workerImpact +
				this.aspect.security.workerImpact +
				this.aspect.family.workerImpact
			;
			this.moraleContribution = {
				family:			this.aspect.family.workerImpact/total,
				security:		this.aspect.security.workerImpact/total,
				entertainment:	this.aspect.entertainment.workerImpact/total,
				leadership:		this.aspect.leadership.workerImpact/total,
			}
		};
		let total = this.personList.sum( person => person.moraleForAspect(aspectId) );

		if( total == 0 ) {
			debugger;
		}

		//console.log(aspectId+' generates '+total+' of '+this.population+' morale.');
		return ( total / this.population ) * (this.moraleContribution[aspectId]||0);
	}
	// ranges from -1.0/bad to 0.0/normal to 1.0/great
	get morale() {
		if( !this.moraleDirty ) {
			return this.moraleCached;
		}
		// Morale is an instantaneous measurement
		let moraleLinear =
			this.moraleForAspect('family') +
			this.moraleForAspect('security') +
			this.moraleForAspect('entertainment') +
			this.moraleForAspect('leadership');
		this.moraleCached = moraleLinear;
		this.moraleDirty  = false;
		//console.log('Morale=',Math.percent(this.moraleCached));
		return this.moraleCached;
	}
	getWisdom(jobType) {
		let bonus = this.aspect.wisdom.getBonus(jobType);
		return bonus;
	}

	getWeightedGear() {
		let total = this.personList.sum( person => person.statGet('gear') > 0 ? 1 : 0 );
		return total / this.population;
	}

	getWeightedVenues() {
		let total = this.personList.sum( person => person.statGet('gear') > 0 ? 1 : 0 );
		return total / this.population;
	}

	getWeightedSkill() {
		// eventually this will have to help show the gap between what they COULD be doing
		// and what their actual jobFocus is.
		// Also, this is a bit weird because skills like construction and doctoring aren't always in use
		let total = 0;
		let aspectCounter = {};
		this.personList.traverse( person => {
			if( person.jobType.neverProductive ) {
				return;
			}
			let aspectId = person.jobType.produces.id;
			aspectCounter[aspectId] = 1;
			total += person.productionSkillImpact();
		});

		return total / Object.count(aspectCounter) / this.population;
	}

	getStatAverage(statId) {
		let total = this.personList.sum( person => person.statGet(statId) );
		return total / this.population;
	}

	structureRepair( list, daysToFullyRepair ) {
		// It won't always be certain who is getting worked on first. Someday make a prioritization system.
		// Especially because with a pure shuffle, it repairs in the worst possible way, not finishing
		// anything first.
		list.shuffle();	
		list.traverse( building => {
			if( building.needsRepair ) {
				let amountToRepair = household.peopleDaysToBuild / daysToFullyRepair;
				let daysToApply = this.aspect.venue.onResourceConsume(amountToRepair);
				building.repair( daysToApply );
			}
		});
	}

	tickDay() {

		console.logProduction( "BEGIN DAY "+this.dayTime.day );

		this.moraleDirty = true;

		this.aspectHash.traverse( aspect => {
			aspect.tickDayBegin();
		});

		this.assignMoraleSurrogates();

		// Assign people to tasks. They might not work on what they normally do, if they have a problem.
		this.personList.traverse( person => {
			// Everybody just does what they do, for now.
		});

		// Produce resources due to people
		this.personList.traverse( person => {
			person.produce( (aspectId, amount) => {
				let aspect = this.aspectHash.get(aspectId);
				aspect.onResourceProduced( amount, person );
			});
		});

		// Produce resources, rarely, due to certain venues (water)
		this.venueList.traverse( venue => {
			venue.produce( (aspectId, amount) => {
				let aspect = this.aspectHash.get(aspectId);
				aspect.onResourceProduced( amount, venue );
			});
		});


		// Home repair
		this.structureRepair( this.householdList, 20 );

		// Venue repair
		this.structureRepair( this.venueList, 30 );

		// All aspects generate whatever they're good at.
		this.aspectHash.traverse( aspect => {
			aspect.generateSituations();
		});

		this.situationList.traverse( situation => situation.tickDay() );

		// Now all people consume daily resources, and heal if necessary
		let consumeHash = {
			food:	(person) => this.aspect.food.onResourceConsumed(1),
			water:	(person) => this.aspect.water.onResourceConsumed(1),
			// You get enough sleep if your home has a bed for you.
			sleep:	(person) => person.household.hasBedFor(person) ? 1 : 0,
			leisure:(person) => 1,	// This is just provided until we work sundays (30%) or overtime (14%/day)...
			// Doctors make people heal twice as fast. But without them, people still heal.
			// Curses to healing would also happen here.
			whole:	(person) => this.aspect.health.onResourceConsumed(1) ? 2 : 1,
			// Works just like whole, but the nature of
			// the disease should be considered, eventually.
			well:	(person) => this.aspect.health.onResourceConsumed(1) ? 2 : 1,
			// This should probably become proportional to the gear that needs repair.
			gear:	(person) => this.aspect.gear.onResourceConsumed(1)
		};

		let statTracker = Object.map( Person.Stats.baseList, () => ({
			loss:0,
			consumed:0,
			gain: 0,
		}));

		// Go by stat, giving to people in random order for fairness
		let personList = this.personList.duplicate();
		Object.each( Person.Stats.baseList, (X,statId) => {
			personList.shuffle();
			personList.traverse( person => {
				let amountLost = person.stats.dailyLoss( statId );
				statTracker[statId].loss += amountLost;

				let consumed = consumeHash[statId](person);
				statTracker[statId].consumed += consumed;

				let amountGained = person.stats.dailyGain( statId, consumed );
				statTracker[statId].gain += amountGained;
			});
		});
		console.logProduction(statTracker);


		this.aspectHash.traverse( aspect => {
			aspect.tickDayEnd();
		});

		// Remove all expired situations.
		this.situationList.remove( situation => situation.dead );

		guiMessage( 'dataDirty', true );

		console.logProduction( "END DAY "+this.dayTime.day );
	}

	tick(dt) {
		while( this.dayTime.day < this.clock.day ) {
			this.dayTime.advanceDays(1);
			this.tickDay();
		}
		this.personList.traverse( person => person.tick(dt) );
	}

	get population() {
		return this.personList.length;
	}
}

return {
	Community: Community
}

});
