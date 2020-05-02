Module.add( 'community', ()=>{

class Community {
	constructor(culture) {
		this.isCommunity = true;
		this.id = Date.makeUid();
		this.culture = culture;
		this.aspectHash = new AspectHash;
		this.personList = new PersonList().setValidator( p=>p.isAlive );
		this.ancestorList = new PersonList().setValidator( p=>p.isDead );
		this.venueList = new VenueList().setValidator( v=>v.type.district );
		this.householdList = new HouseholdList;
		this.eventList = new ListManager;

		this.moraleDirty = true;
		this.day = 1;

		this.communityBuilder = new CommunityBuilder(this)

		Object.each( AspectTypeHash, (aspectType,aspectTypeId) => {
			let aspectClassId = String.capitalize(aspectTypeId);
			let aspectClass = Aspect[aspectClassId] || Aspect.Base;
			this.aspectHash.add( aspectTypeId, new aspectClass(this,aspectType) );
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
	moraleForAspect(aspectId) {
		if( !this.moraleContribution ) {
			let total = this.aspect.leadership.workerImpact + this.aspect.entertainment.workerImpact + this.aspect.security.workerImpact + this.aspect.children.workerImpact;
			this.moraleContribution = {
				children:		this.aspect.children.workerImpact/total,
				security:		this.aspect.security.workerImpact/total,
				entertainment:	this.aspect.entertainment.workerImpact/total,
				leadership:		this.aspect.leadership.workerImpact/total,
			}
		};
		let total = this.personList.sum( person => person.moraleForAspect(aspectId) );
		//console.log(aspectId+' generates '+total+' of '+this.population+' morale.');
		return ( total / this.population ) * (this.moraleContribution[aspectId]||0);
	}
	// ranges from -1.0/bad to 0.0/normal to 1.0/great
	get morale() {
		if( !this.moraleDirty ) {
			return this.moraleCached;
		}
		// Morale is an instantaneous measurement
		let moraleAll =
			this.moraleForAspect('leadership') +
			this.moraleForAspect('entertainment') +
			this.moraleForAspect('children') +
			this.moraleForAspect('security');
		this.moraleCached = moraleAll;
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
		this.moraleDirty = true;

		this.aspectList.traverse( aspect => {
			aspect.tickDayBegin();
		});

		// Assign people to tasks. They might not work on what they normally do, if they have a problem.
		this.personList.traverse( person => {
			// Everybody just does what they do, for now.
		});

		// Produce resources
		this.personList.traverse( person => {
			person.produce( (aspectId,amount) => {
				let aspect = this.aspectHash[aspectId];
				aspect.onResourceProduced( amount, person );
			});
		});

		// Home repair
		this.structureRepair( this.householdList, 20 );

		// Venue repair
		this.structureRepair( this.venueList, 30 );

		// All aspects generate whatever they're good at.
		this.aspectHash.traverse( aspect => {
			aspect.generateEvents();
		});

		this.eventList.traverse( event => event.tickDay() );

		// Now all people consume daily resources, and heal if necessary
		let consumeHash = {
			food:	(person) => this.aspect.food.onResourceConsumed(1),
			water:	(person) => this.aspect.water.onResourceConsumed(1),
			sleep:	(person) => person.household.hasBedFor(person),
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

		// Go by stat, giving to people in random order for fairness
		let personList = this.personList.slice();
		Object.each( Stats.idList, statId => {
			personList.shuffle();
			personList.traverse( person => {
				person.stats.dailyLoss( statId );
				let amount = consumeHash[statId](person);
				person.stats.dailyGain( stat.id, amount );
			});
		});

		this.aspectList.traverse( aspect => {
			aspect.tickDayEnd();
		});

		// Remove all expired events.
		this.eventList.remove( event => event.dead );
	}

	tick(dt) {
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
