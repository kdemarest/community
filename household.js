Module.add( 'household', ()=>{

let ResidenceType = {
	isHouseholdType: true,
	id: 'residence'
}

class Household extends StructureHolder {
	constructor() {
		super();
		this.structure = new Structure();
		this.isHousehold	= true;
		this.memberList		= [];
		this.uid = Date.makeUid();
		this.icon = 'household.png';
		this.type = ResidenceType;
	}

//-------------------------
	get id() {
		return this.head.nameLast+'-'+this.uid;
	}
	get preferredDistrictId() {
		return 'residential';
	}
	get structureSize() {
		return Math.max(1,this.bedCapacity);
	}
//-------------------------
	mergeIntoVenue(venue) {
		this.icon = null;
		this.isWithinVenue = true;
		this.structure = venue.structure;
		this.isParasite = true;	// I don't own my structure
		console.assert( venue.household == null || venue.household === this );
		venue.household = this;
	}
	get textSummary() {
		return this.head.nameLast+' ('+this.bedCapacity+')';
	}
	set bedCount(value) {
		console.assert(false);
	}
	get isOperational() {
		return !this.structure.needsRepair;
	}
	get bedCapacity() {
		return this.memberList.length;
	}
	get bedsAvailable() {
		return !this.isOperational ? 0 : this.memberList.length;
	}
	hasBedFor( person ) {
		let index = this.memberList.indexOf( person );
		return this.bedsAvailable > index;
	}
	add(person) {
		this.memberList.push(person);
		person._household = this;
		console.logHousehold('Add '+person.textSummary+' to household '+this.text);
	}
	get head() {
		if( this.memberList.length == 1 ) {
			return this.memberList[0];
		}
		let person = this.memberList.find( person => person.isHusband && !person.isBum && !person.isDomestic );
		if( !person ) {
			person = this.memberList.find( person => person.isWife && !person.isBum && !person.isDomestic );
		}
		if( !person ) {
			person = this.memberList.find( person => person.isWidower && !person.isBum && !person.isDomestic );
		}
		if( !person ) {
			person = this.memberList.find( person => person.isWidow && !person.isBum && !person.isDomestic );
		}
		if( !person ) {
			// Choose the oldest.
			person = this.memberList[0];
			this.memberList.forEach( p => person = p.age > person.age ? p : person );
		}
		console.assert( person );
		return person;
	}
	get memberCount() {
		return this.memberList.length;
	}
	get surname() {
		return this.memberList.length ? this.memberList[0].surname : 'noNameYet';
	}
	get textTitle() {
		if( this.head.isSingle && this.memberCount > 1 ) {
			return 'friends';
		}
		return this.head.nameFirst+' '+this.surname;
	}
	get text() {
		let s = '';
		s = this.textTitle+' home: '+Array.joinAnd( this.memberList.map( member => member.textSummary ) );
		if( this.memberCount == 1 ) {
			let head = this.head;
			if( !head.spouse ) {
				s += ' unmarried';
			}
			if( head.mother.isAlive || head.father.isAlive ) {
				s += ' ('+head.titleChild+' of '+head.father.textSummary+' and '+head.mother.textSummary+')';
			}
		}
		return s;
	}
}

class HouseholdList extends ListManager {
	constructor() {
		super();
	}
	get bedCapacity() {
		return this.sum( household => household.bedCapacity );
	}
}

return {
	Household: Household,
	HouseholdList: HouseholdList
}

});

