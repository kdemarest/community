Module.add( 'communityBuilder', () => {

class CommunityBuilder {
	constructor(community) {
		this.community = community;
		this.stockList = {};
		this.venuesDesired = {};
		this.population = null;
		this.combinedList = new PersonList();
	}
	get venueList() {
		return this.community.venueList;
	}

	get householdList() {
		return this.community.householdList;
	}

	makeHusbandOf(person) {
		let venue   = this.venueList.pick();
		let jobType = new Finder( venue.jobTypeHash ).pick();
		let husband = new Person( person.culture, this.community, jobType, venue, {
			gender: 'M',
			age: Math.randInt( Math.max(person.age-8,person.culture.marryingAge), person.age+8 ),
			dead: true	// Someday we might let this person live by exist elsewhere
		});
		this.combinedList.add( husband );
		return husband;
	}

	makeMotherOf(person) {
		let venue   = this.venueList.pick();
		let jobType = new Finder( venue.jobTypeHash ).pick();
		let mother = new Person( person.culture, this.community, jobType, venue, {
			gender: 'F',
			age: Math.randInt( person.age+person.culture.marryingAge, person.age+person.culture.menopauseAge ),
			dead: true	// Someday we might let this person live by exist elsewhere
		});
		this.combinedList.add( mother );

		// And since every living person needs to have a mother and father...
		let husband = this.combinedList.find( husband => husband.canBeHusbandOf(mother) );
		husband = husband || this.makeHusbandOf(mother);
		mother.spouse = husband;
		console.assert( husband.spouse );

		return mother;
	}

	createRelatedness(combinedLIst) {
		let hack = 0;

		this.combinedList.shuffle();

		// Find or make my mother, which auto-makes mother-based families
		this.combinedList.traverse( person => {
			let mother = this.combinedList.find( mom => mom.canBeMotherOf(person) );
			mother = mother || this.makeMotherOf( person );
			person.mother = mother;
		});

		// Find or make my Husband
		this.combinedList.traverse( person => {
			let needsHusband = !person.spouse && person.isFemale && (person.childCount > 0 || person.culture.chanceMarried(person));
			if( needsHusband ) {
				let husband = this.combinedList.find( spouse => spouse.canBeHusbandOf(person) );
				husband = husband || this.makeHusbandOf(person);
				person.spouse = husband;
				console.assert( husband );
			}
		});

		this.combinedList.traverse( person => {
			console.assert( person.dead || (person.mother && person.father) );
		});

		// Assign surnames
		let doSurname = person => {
			if( person.surname ) {
				return person.surname;
			}
			person.surname =
				person.husband ? doSurname(person.husband) :
				person.father ? doSurname(person.father) :
				person.culture.generateSurname(person.nameFirst)
			;
			return person.surname;
		}
		this.combinedList.traverse( person => doSurname(person) );

		// Validate surnames
		this.combinedList.traverse( person => {
			console.assert( person.surname );
			if( person.spouse ) {
				console.assert( person.surname == person.spouse.surname );
			}
			if( person.father && !(person.isFemale || person.spouse) ) {
				console.assert( person.surname == person.father.surname );
			};
		});

		this.combinedList.traverse( person => {
			if( person.isOrphan ) {
				person.guardian = this.combinedList.finder.filter( guardian => guardian.isAlive && !guardian.isMinor ).pick();
				console.assert( person.guardian );
			}
		});

	}

	createHouseholds() {

		let doHousehold = person => {
			console.assert( person.isAlive );
			if( person.household ) {
				return person.household;
			}
			if( person.isOrphan ) {
				return person.household = doHousehold( person.guardian );
			}
			if( person.isMinor ) {
				return person.household = doHousehold( person.father.isAlive ? person.father : person.mother );
			}
			if( person.husband && person.husband.isAlive ) {
				return person.household = doHousehold( person.husband );
			}

			if( !person.hasMinorChildren ) {
				// Find any unmarried same-gender person my age.
				let single =  this.combinedList.find( p =>
					p.isAlive &&
					person.age < p.age &&
					person.gender==p.gender &&
					(p.isSingle || p.isWidow || p.isWidower) &&
					!p.hasMinorChildren &&
					p.culture.singleCohabitAgeMatch(p,person)
				);
				if( single ) {
					return person.household = doHousehold( single );
				}
			}

			person.household = new Household( person );
			this.householdList.add( person.household );
			return person.household;
		}
	
		this.combinedList.traverse( person => {
			if( person.isDead ) {
				return;
			}
			doHousehold( person );
		});

		this.householdList.traverse( household => {
			household._bedCount = household.memberCount;
		});
	}

	addVenueBySketch(sketch,isFirst) {
		let venueType;
		let repLimit = 100;
		do { 
			venueType = sketch.table.pick();
		} while( isFirst && venueType.neverPickFirst && --repLimit );
		console.assert( repLimit );
		let workforceRatio	= Math.min( 1.0, venueType.workforceRatio || sketch.workforceRatio );
		console.assert( workforceRatio && Number.isFinite(workforceRatio) );
		let workforceMax	= Math.clamp( Math.floor( workforceRatio*sketch.workersTotal ), 1, venueType.workforceMax || 999 );
		let workerCapacity	= venueType.alwaysMaxWorkforce ? workforceMax : Math.randInt( 1, workforceMax );
		let venue = new Venue( venueType, workerCapacity );
		//console.log('Picked '+venue.text);
		this.venueList.add( venue );
		return venue;
	}

	addPeopleFor(venue) {
		if( !venue.jobTypeHash || Object.isEmpty(venue.jobTypeHash) ) {
			return;
		}

		let chanceForJobType = 1;
		let jobPicker		= new Pick.Table().scanHash( venue.jobTypeHash, jobType => jobType.chance || chanceForJobType )
		let mustPickFirst 	= Object.find( venue.jobTypeHash, jobType => jobType.mustPickFirst );
		let useIfSingular	= Object.find( venue.jobTypeHash, jobType => jobType.useIfSingular );
		let workersRemaining = venue.workerCapacity;
		let isFirst = true;

		while( workersRemaining > 0 ) {
			let jobType =
				venue.workerCapacity==1 && useIfSingular ? useIfSingular :
				isFirst && mustPickFirst ? mustPickFirst :
				jobPicker.pick()
			;
			let isBoss = venue.workerCapacity==1 || mustPickFirst;
			isFirst = false;
			mustPickFirst = null;
			if( jobType.onePerVenue ) {
				jobPicker.forbid( pickerJobType => pickerJobType.id == jobType.id );
			}
			let person = new Person( this.community.culture, this.community, jobType, venue, { isBoss: isBoss } );
			this.combinedList.add( person );
			--workersRemaining;
		}
	}

	createVenues(population) {
		// Generate venues that roughly meet the population's needs
		let chanceOfEachVenueType = 1;
		let sketchHash	= Object.map( AspectTypeHash, (aspectType,aspectTypeId) => ({
			workforceRatio: aspectType.workforceRatio,
			workersTotal: 0,
			workersPending: 0,
			table: new Pick.Table().scanHash(
				aspectType.venueTypeHash,
				venueType => venueType.chance || chanceOfEachVenueType
			)
		}) );

		// Rough-out number of workers toiling to serve each aspectType, but not the actual persons.
		new Pick.Stocker()
			.scanHash(
				AspectTypeHash,
				aspectType => aspectType.percentOfPopulation||0,
				aspectType => { sketchHash[aspectType.id].workersPending++; sketchHash[aspectType.id].workersTotal++; }
			)
			.produce( population )
		;

		// Now generate the venues they toil at
		Object.each( sketchHash, sketch => {
			let isFirst = true;
			while( sketch.workersPending > 0 ) {
				let venue = this.addVenueBySketch( sketch, isFirst );
				isFirst = false;
				sketch.workersPending -= venue.workerCapacity;
				let chanceMod = venue.onePerCommunity ? 0.0 : 0.3;
				sketch.table.changeChanceOfLast(chanceMod);	// haf as likely to pick this again
				sketch.table.relevel();
			}
		});
	}

	initAspects() {
		this.community.aspectHash.traverse( aspect => aspect.init() );
	}

	build(population) {

		// Create all the venues that serve this population
		this.createVenues(population);

		// Add people appropriate to all the venues
		this.venueList.traverse( venue => {
			this.addPeopleFor(venue);
		});

		// Now make everyone related, creating dead ancestors as needed
		this.createRelatedness();

		// Give a venue to live
		this.createHouseholds();

		this.combinedList.traverse( person => this.community[person.isAlive?'personList':'ancestorList'].add( person ) );

		this.initAspects();
	}
}

return {
	CommunityBuilder: CommunityBuilder
}

});
