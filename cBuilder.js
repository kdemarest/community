Module.add( 'communityBuilder', () => {

class CommunityBuilder {
	constructor(community) {
		this.community = community;
		this.stockList = {};
		this.venuesDesired = {};
		this.population = null;
		this.combinedList = new PersonList();
	}

	get householdList() {
		return this.community.householdList;
	}

	makeHusbandOf(person) {
		let venue   = this.community.venueList.pick();
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
		let venue   = this.community.venueList.pick();
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

			person.household = new Household();
			this.householdList.add( person.household );
			return person.household;
		}
	
		this.combinedList.traverse( person => {
			if( person.isDead ) {
				return;
			}
			doHousehold( person );
		});
	}

	addPeopleFor(venue) {
		if( !venue.jobTypeHash || Object.isEmpty(venue.jobTypeHash) ) {
			debugger;
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
			let venueActual = venue.isFakeVenue ? null : venue;
			let person = new Person( this.community.culture, this.community, jobType, venueActual, { isBoss: isBoss } );
			this.combinedList.add( person );
			--workersRemaining;
		}
	}

	createVenueBySketch(sketch,isFirst) {
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
		return venue;
	}

	createSketchVenues(population) {
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
		let sketchVenueList = new ListManager();
		Object.each( sketchHash, sketch => {
			let isFirst = true;
			while( sketch.workersPending > 0 ) {
				let venue = this.createVenueBySketch( sketch, isFirst );
				sketchVenueList.add( venue );
				isFirst = false;
				sketch.workersPending -= venue.workerCapacity;
				let chanceMod = venue.onePerCommunity ? 0.0 : 0.3;
				sketch.table.changeChanceOfLast(chanceMod);	// haf as likely to pick this again
				sketch.table.relevel();
			}
		});

		return sketchVenueList;
	}

	layoutCity() {
		class District extends Cluster {
			constructor(districtId,flagId) {
				super(districtId);
				this[flagId] = true;
				this.count = 0;
			}
		}

		let getDistrict = (districtId,flagId) => {
			if( !districtHash[districtId] ) {
				districtHash[districtId] = new District(districtId,flagId);
			}
			return districtHash[districtId];
		}

		// 'any', 'military' and 'outlier' are not included here.
		let anyDistrictId = ['wealthy','market','industrial','residential'];
		let districtHash = {};

		// Each structure gets a radius in tiles.
		this.community.structureTraverse( structure => {
			structure.tileRadius = Math.sqrt(structure.structureSize);
		});

		let districtGuide = {
			military: { limit: 1, remaining: 0 },
			outlier: { limit: 1, remaining: 0 },
			residential: { limit: 8, remaining: 0 },
		}


		let once = true;
		let districtSeparate = (districtId) => {
			let result = districtId;
			if( districtGuide[districtId] ) {
				if( districtGuide[districtId].remaining <= 0 ) {
					districtGuide[districtId].remaining = districtGuide[districtId].limit;
					districtGuide[districtId].last = districtId+'-'+Date.makeUid();
				}
				districtGuide[districtId].remaining -= 1;
				result = districtGuide[districtId].last;
			}
			return result;
		}

		let structureList = this.community.structureList;
		structureList.shuffle();

		// Establish the districts, and make the venues point to them.
		structureList.traverse( structure => {
			console.assert( structure.preferredDistrictId );
			let districtId = structure.preferredDistrictId;
			if( districtId == 'any' ) {
				districtId = anyDistrictId[Math.randInt(0,anyDistrictId.length)];
			}
			let flagId = 'is'+String.capitalize(districtId);
			districtId = districtSeparate(districtId);
			structure.district = getDistrict( districtId, flagId );
			console.assert( structure.district.id == districtId );
			console.assert( structure.district.id !== 'residential' );
			structure.district.count++;
		});

		// put all buildings in their districts.
		structureList.traverse( structure => {
			console.assert( structure.district.id !== 'residential' );
			console.assert( structure.district );
			structure.circle = structure.district.findRandom( structure.tileRadius );
			structure.circle.id = structure.id;
			structure.district.add( structure.circle );
		});

		// Re-center every district before adding, just to be safe.
		Object.each( districtHash, district => {
			district.moveBy( -district.x, -district.y );
		});

		// Now place the city center districts
		let city = new Cluster();
		Object.each( districtHash, (district,d) => {
			if( district.isOutlier ) return;
			let circle = city.findRandom(district.radius);
			district.moveBy(-district.x+circle.x, -district.y+circle.y);
			city.add( district );
		});

		Object.each( districtHash, (district,d) => {
			if( !district.isOutlier ) return;
//			console.log( "outlier: "+district.id );
			let circle = city.findRandom(district.radius);
			district.moveBy(-district.x+circle.x, -district.y+circle.y);
			city.add( district );
		});


		// Now center the city and districts and set scale from -1.0 to 1.0
		let unitCircle = new Circle('UNIT',0,0,1.0);
		city.moveBy( -city.x, -city.y );
		let normalizer = 1/city.radius;
		city.scaleBy( normalizer );
		unitCircle.scaleBy( normalizer );

		let getDist		= (dx,dy) => Math.sqrt(dx*dx+dy*dy);

		let mega = new Cluster();
		Object.each( districtHash, district => {
			district.traverse( circle => mega.add(circle) );
		});
		mega.sort( (a,b)=>{
			let aDist = getDist(a.x-mega.x,a.y-mega.y);
			let bDist = getDist(b.x-mega.x,b.y-mega.y);
			return aDist<bDist ? -1 : bDist>aDist ? 1 : 0;
		});

		for( let i=0 ; i<3 ; ++i ) {
			mega.traverse( circle => {
				let collisionList = mega.travelTo(mega.x,mega.y,circle,circle.radius*0.05);
				if( collisionList.length == 1 && mega.length > 1 ) {
					mega.spinAbout(collisionList[0],circle,Math.PI*2*0.01);
				}
			});
		}

		Object.each( districtHash, district => district.process() );

		let expansion = 1.2;
		city.expandBy( expansion );

  		for( let i=0 ; i<3 ; ++i ) {
			Object.each( districtHash, (district,d) => {
				if( district.length <= 1 ) {
					return;
				}
				let list = district.list;
				list.forEach( circle => {
					district.remove( c => c.id==circle.id );
					let friend = district.findClosest(circle);
					district.travelTo(friend.x,friend.y,circle);
					district.add(circle);
				});
			});
		}

		this.community.unitCircle = unitCircle;

		this.community.districtHash = new HashManager();
		this.community.districtHash.hash = districtHash;

		this.community.venueList.traverse( venue => {
			if( !venue.district ) return;
//			console.log(venue.id,Math.floor(venue.circle.x*100),Math.floor(venue.circle.y*100),Math.floor(venue.circle.radius*100));
		});
	}

	build(population) {

		// Create all the venues that serve this population
		let sketchVenueList = this.createSketchVenues(population);

		// Put eligible venues into the community
		sketchVenueList.traverse( venue => !venue.isFakeVenue ? this.community.venueList.add(venue) : null );

		// Add people appropriate to all the venues
		sketchVenueList.traverse( venue => {
			this.addPeopleFor(venue);
		});

		// Now make everyone related, creating dead ancestors as needed
		this.createRelatedness();

		// Give a place to live
		this.createHouseholds();

		// Put everything into the city
		this.layoutCity();

		this.combinedList.traverse( person => {
			let personSizeCompareToSinglePersonHouse = 0.5;
			person.circle = new Circle(person.id,0,0,this.community.unitCircle.radius*personSizeCompareToSinglePersonHouse);
			this.community[person.isAlive?'personList':'ancestorList'].add( person );
		});

		this.community.initAspects();

		this.community.assignMoraleSurrogates();

		this.community.isBuilt = true;
	}
}

return {
	CommunityBuilder: CommunityBuilder
}

});
