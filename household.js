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
		this.text = new Household.Text(this);
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
		venue._addHousehold(this);
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
		console.logHousehold('Add '+person.text.summary+' to household '+this.text.text);
	}
	get head() {
		if( this.memberList.length == 1 ) {
			return this.memberList[0];
		}
		let person = this.memberList[0];
		this.memberList.forEach( p => person = (p.respect > person.respect) ? p : person );

		console.assert( person );
		return person;
	}
	get memberCount() {
		return this.memberList.length;
	}
	get surname() {
		return this.memberList.length ? this.memberList[0].surname : 'noNameYet';
	}
}

Household.Text = class {
	constructor(household) {
		this.household = household;
	}
	get surname() {
		return this.household.surname;
	}
	get summary() {
		return this.household.head.text.nameLast+' ('+this.household.bedCapacity+')';
	}
	get title() {
		if( this.household.head.isSingle && this.household.memberCount > 1 ) {
			return 'friends';
		}
		return this.household.head.text.nameFirst+' '+this.surname;
	}
	get text() {
		let s = '';
		s = this.title+' home: '+Array.joinAnd( this.household.memberList.map( member => member.text.summary ) );
		if( this.household.memberCount == 1 ) {
			let head = this.household.head;
			if( !head.spouse ) {
				s += ' unmarried';
			}
			if( head.mother.isAlive || head.father.isAlive ) {
				s += ' ('+head.text.titleChild+' of '+head.father.text.summary+' and '+head.mother.text.summary+')';
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

