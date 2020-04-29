Module.add( 'household', ()=>{

class Household {
	constructor() {
		this.isHousehold  = true;
		this.memberList   = [];
		this.structure = new Structure();
	}
	set bedCount(value) {
		console.assert(false);
	}
	get isOperational() {
		return !this.structure.needsRepair;
	}
	get bedCount() {
		return !this.isOperational ? 0 : this.memberList.length;
	}
	hasBedFor( person ) {
		let index = this.memberList.indexOf( person );
		return this.bedCount > index;
	}
	add(person) {
		this.memberList.push(person);
		person._household = this;
		console.log('Add '+person.textSummary+' to household '+this.text);
	}
	get head() {
		if( this.memberList.length == 1 ) {
			return this.memberList[0];
		}
		let person = this.memberList.find( person => person.isAlive && person.isHusband && !person.isWidower );
		if( !person ) {
			person = this.memberList.find( person => person.isAlive && person.isWife  && !person.isWidow );
		}
		if( !person ) {
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
	get title() {
		if( this.head.isSingle && this.memberCount > 1 ) {
			return 'friends';
		}
		return this.head.nameFirst+' '+this.surname;
	}
	get text() {
		let s = '';
		s = this.title+' home: '+Array.joinAnd( this.memberList.map( member => member.textSummary ) );
		if( this.memberCount == 1 ) {
			let head = this.head;
			if( !head.spouse ) {
				s += ' unmarried';
			}
			if( head.mother.isAlive || head.father.isAlive ) {
				s += ' ('+head.childTitle+' of '+head.father.textSummary+' and '+head.mother.textSummary+')';
			}
		}
		return s;
	}
}

class HouseholdList extends ListManager {
	constructor() {
		super();
	}
	get bedCount() {
		return this.sum( household => household.bedCount );
	}
}

return {
	Household: Household,
	HouseholdList: HouseholdList
}

});

