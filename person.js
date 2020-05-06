Module.add( 'person', ()=> {

let daysForGearToDie = 100;


class Stats {
	constructor() {
		this.list = {};
		Object.each( Stats.baseList, (stat,statId) => {
			this.list[statId] = Object.assign( {}, stat );
		});
		this.traverse( (stat,statId) => {
			stat.value = stat.max;
		});
	}
	validate(statId) {
		console.assert(this.list[statId] && this.list[statId].max);
	}
	traverse(fn) {
		Object.each( this.list, fn );
	}
	getRatio(statId) {
		this.validate(statId);
		return this.list[statId].value / this.list[statId].max;
	}
	dailyGain(statId,amount) {
		this.validate(statId);
		let stat = this.list[statId];
		if( amount === true ) {
			amount = 1.0;
		}
		console.assert( Number.isFinite(amount) );
		stat.value = Math.clamp( stat.value + stat.increment*amount, 0, stat.max );
	}
	dailyLoss(statId) {
		this.validate(statId);
		let stat = this.list[statId];
		stat.value = Math.clamp( stat.value - stat.dailyLoss, 0, stat.max );
		return stat.dailyLoss;
	}
}

Stats.baseList = {
	food:	{ increment:  3.0, max: 14, dailyLoss: 1 },
	water:	{ increment:  3.0, max:  3, dailyLoss: 1 },
	sleep:	{ increment:  2.0, max:  4, dailyLoss: 1 },
	leisure:{ increment: 10.0, max: 30, dailyLoss: 1 },
	whole:	{ increment:  0.1, max:  1, dailyLoss: 0 },
	well:	{ increment:  0.1, max:  1, dailyLoss: 0 },
	gear:	{ increment:  1/daysForGearToDie, max:  1, dailyLoss: 1/daysForGearToDie },
};

Object.each( Stats.baseList, (stat,statId) => {
	stat.id = statId;
});


class Person {
	constructor(culture,community,jobType,venue,inject) {
		console.assert( culture && community && jobType );
		console.assert( culture.isCulture && community.isCommunity && jobType.isJobType && (!venue || venue.isVenue) );

		this.isPerson	= true;
		this.culture	= culture;
		this.community	= community;
		this.jobType	= jobType;
		this.jobFocus	= this.jobType;
		this.id			= Date.makeUid();
		this.venue		= venue;
		if( venue ) { venue.workerAdd(this); }
		this.age		= inject.age!==undefined ? inject.age : culture.generateAge(jobType.isChild);
		delete inject.age;
		this.gender		= inject.gender || culture.generateGender();
		delete inject.gender;

		this.nameFirst	= String.capitalize( this.culture.generateName(this.gender) );
		this.culture.validateNameFirst(this.nameFirst,this.gender);

		this._skillRating = {
			[jobType.id]: this.culture.generateSkillIndex()
		};
		this.stats		= new Stats();
		this.circle		= null;
		this.habit		= new Habit.Manager(this);

		this.wounded	= false;
		this.diseased	= false;
		Object.assign( this, inject );
		if( this.isFemale ) {
			this._childList = this._childList || [];
			let maxChildren = Math.clamp( this.age-culture.marryingAge, 0, 4 );
			if( this.isDomestic ) {
				maxChildren += 1;
			}
			this.nominalChildren = maxChildren; //Math.randInt( 0, maxChildren );
		}
	}

	set gender(value) {
		console.assert( value =='M' || value == 'F' );
		console.assert( this._gender === undefined );
		this._gender = value;
	}
	get gender() {
		return this._gender;
	}

	statGet(statId) {
		return this.stats.getRatio(statId);
	}
	statDaily(id) {
		this.stat[id]
	}
	get icon() {
		console.assert( this.jobType.icon.img );
		return 'icons/'+this.jobType.icon.img;
	}

	get iconHolding() {
		return this.jobType.icon.holding ? 'icons/'+this.jobType.icon.holding : null;
	}

	get isDomestic() {
		return this.jobType.isDomestic;
	}
	get isBum() {
		return this.jobType.isBum;
	}
	get family() {
		console.assert(false);
	}
	get allowAnotherKid() {
		console.assert( this.isFemale );
		return this.childList.length < this.nominalChildren;
	}
	canBeMotherOf(kid) {
		return this.culture.canBeMotherOf(this,kid);
	}
	canBeHusbandOf(wife) {
		return this.culture.canBeHusbandOf(this,wife);
	}
	set mother(m) {
		console.assert( m instanceof Person );
		this._mother = m;
		m.childList.push(this);
	}
	get mother() {
		return this._mother;
	}
	get father() {
		return this._mother ? this._mother.spouse : null;
	}
	set spouse(person) {
		console.assert( person instanceof Person );
		console.assert( !this.spouse );
		console.assert( !person.spouse );
		console.assert( this.age >= this.culture.marryingAge );
		console.assert( person.age >= this.culture.marryingAge );
		this._spouse = person;
		person._spouse = this;
	}
	get isTwin() {
		return this._twin;
	}
	get twin() {
		return this._twin;
	}
	set twin(person) {
		console.assert(person);
		this._twin = person;
		person._twin = this;
	}
	get spouse() {
		return this._spouse;
	}
	get isSingle() {
		return !this.isMinor && !this.spouse;
	}
	get husband() {
		return this.isFemale ? this.spouse : null;
	}
	get wife() {
		return this.isMale ? this.spouse : null;
	}
	isSiblingOf(person) {
		return this.mother && this.mother.childList.includes( person );
	}
	get isOrphan() {
		if( !this.isMinor ) {
			return false;
		}
		let motherDead = !this.mother ? false : this.mother.isDead;
		let fatherDead = !this.father ? false : this.father.isDead;
		return motherDead && fatherDead;
	}
	set household(h) {
		h.add( this );
	}
	get household() {
		return this._household;
	}

	get isDead() {
		return this.dead;
	}
	get isAlive() {
		return !this.isDead;
	}
	get isMarried() {
		return this.spouse && this.spouse.isAlive;
	}
	get siblingList() {
		console.assert( this.mother );
		return this.mother.childList;
	}
	get isMinor() {
		return this.age < this.culture.ageOfMajority;
	}
	get isChild() {
		console.assert( false );
	}
	get isCalledBoss() {
		return this.isBoss && this.venue && this.venue.workerCount>1;
	}
	get isWidow() {
		return this.isFemale && this.spouse && this.spouse.isDead;
	}
	get isWidower() {
		return this.isMale && this.spouse && this.spouse.isDead;
	}

	get titleJob() {
		return this.isMinor ? this.titleChildJob : this.jobType.name;
	}
	get name() {
		return this.nameFirst;
	}
	get nameLast() {
		return this.surname;
	}
	get nameFull() {
		return this.titleDead + this.nameFirst+(this.nameLast ? ' '+this.nameLast : '');
	}
	get nameMaiden() {
		if( !this.isWife || !this.father ) {
			return;
		}
		return this.father.surname;
	}
	get respect() {
		return this.culture.getRespect(this);
	}
	get titleDead() {
		return this.isDead ? 'the late ' : '';
	}
	get titleParent() {
		return this.isFemale ? 'mother' : 'father';
	}
	get titleChild() {
		return this.isFemale ? 'daughter' : 'son';
	}
	get titleChildJob() {
		if( this.age < 3 ) {
			return 'baby';
		}
		if( this.age < 7 ) {
			return 'toddler';
		}
		if( this.age < 13 ) {
			return 'kid';
		}
		if( this.age < 19 ) {
			return 'teen';
		}
	}
	get textMarriageRole() {
		if( this.isWidow ) {
			return  'widow';
		}
		if( this.isWidower ) {
			return  'widower';
		}
		if( this.isHusband ) {
			return 'husband';
		}
		if( this.isWife ) {
			return 'wife';
		}
		return '';
	}
	get textRole() {
		if( this.isOrphan ) {
			return 'orphan';
		}
		if( this.isWidow ) {
			return  'widow';
		}
		if( this.isWidower ) {
			return  'widower';
		}
		if( this.isDead && !this.mother && this.isMale ) {
			return 'patriarch';
		}
		if( this.isDead ) {
			return 'ancestor';
		}
		if( this.isHusband ) {
			return 'husband';
		}
		if( this.isWife ) {
			return 'wife';
		}
		if( this.isGrandfather ) {
			return 'grandpa';
		}
		if( this.isGrandmother ) {
			return 'gramma';
		}

		return '';
	}
	get textFamilyRole() {
		if( this.isOrphan ) {
			return 'orphan';
		}
		if( this.isWidow ) {
			return  'widow';
		}
		if( this.isWidower ) {
			return  'widower';
		}
		if( this.isDead ) {
			return 'ancestor';
		}
		if( this.isHusband ) {
			return 'husband';
		}
		if( this.isWife ) {
			return 'wife';
		}
		if( this.isMinor ) {
			return this.titleChild;
		}
		if( this.isGrandfather ) {
			return 'grandpa';
		}
		if( this.isGrandmother ) {
			return 'gramma';
		}
		if( this.isSingle ) {
			return 'unmarried';
		}

		return '';
	}
	_textSummaryMake(andLast,andJob) {
		let maidenName = this.nameMaiden;
		let role = this.textRole;
		return (role?role+' ':'')+
			this.nameFirst+
			(andLast ? ' '+this.nameLast+(maidenName ? ' (nee '+maidenName+')' : '') : '' )+
			' '+this.gender+this.age+
			(andJob ? ' '+this.textJobSummary : '')
		;
	}
	get textBoyGirl() {
		return this.gender=='M' ? 'boy' : 'girl';
	}
	get textManWoman() {
		return this.gender=='M' ? 'man' : 'woman';
	}
	get textInformalGender() {
		return this.isMinor ? this.textBoyGirl : this.textManWoman;
	}
	get textGender() {
		return this.gender=='M' ? 'male' : 'female';
	}
	get textGenderAge() {
		return this.gender+this.age; //+'/'+this.respect;
	}
	get textSkillLevel() {
		let skillLevelName = ['unskilled','skilled','excellent','epic'];
		return skillLevelName[Math.floor(this.skillAt(this.jobType.id))];
	}
	get textSkillShort() {
		return 's'+this.skillAt(this.jobType.id)
	}
	get textJob() {
		return String.capitalize(this.titleJob);
	}
	get textJobSummary() {
		return this.textSkillShort+' '+this.textJob;
	}
	get textInfo() {
		return String.capitalize(this.titleJob)+' '+this.nameFirst+' '+this.nameLast;
	}
	get textSummary() {
		return this._textSummaryMake();
	}
	get textSummaryFull() {
		return this._textSummaryMake(true);
	}
	get textProduction() {
		return Math.fixed(this.productionBaselineForJob(this.jobType.id),2)+' '+this.jobType.produces.id;
	}
	get text() {
		if( this.isDead ) {
			let s = 'Dead person: '+this.textSummaryFull;
			if( this.isFemale ) {
				s += ' '+this.titleParent+' of '+this.childCount;
			}
			else {
				s += ' husband of '+this.spouse.textSummary;
			}
			return s;
		}
		return 'Person: '+this.textSummaryFull+' the '+this.textJobSummary+
			(this.isCalledBoss?' (boss)':'')+
			', produces '+this.textProduction;
	}
	get textLineage() {
		if( !this.father ) {
			return this.textSummaryFull;
		}
		return this.textSummaryFull+', '+this.titleChild+' of '+this.father.textLineage;
	}
	get oppositeGender() {
		return {M:'F',F:'M'}[this.gender];
	}
	get isMale() {
		return this.gender == 'M';
	}
	get isFemale() {
		return this.gender == 'F';
	}
	get isHusband() {
		return this.isMale && (this.spouse && this.spouse.isAlive);
	}
	get isWife() {
		return this.isFemale && (this.spouse && this.spouse.isAlive);
	}
	get isGrandfather() {
		if( !this.isMale || this.childCount==0 ) {
			return false;
		}
		return this.childList.find( child => child.childCount );
	}
	get isGrandmother() {
		if( !this.isFemale || this.childCount==0 ) {
			return false;
		}
		return this.childList.find( child => child.childCount );
	}
	get childCount() {
		return this.childList.length;
	}
	get childList() {
		return this.isFemale ? this._childList : this.spouse ? this.spouse.childList : [];
	}
	get hasMinorChildren() {
		return this.childList.find( child => child.isMinor );
	}
	get wellbeing() {
		return Math.clamp(
			Math.min(
				this.statGet('food'),
				this.statGet('water'),
				this.statGet('sleep'),
				this.statGet('leisure'),
				this.statGet('whole'),
				this.statGet('well')
			), 0, 1.0
		);
	}

	setSurrogate(jobType) {
		this.surrogate = this.surrogate || {};
		this.surrogate[jobType.produces.id] = jobType;
		this._skillRating[jobType.id] = this.culture.generateSkillIndex();
	}

	skillAt(jobId) {
		let skillIndex = this._skillRating[jobId] || 0;		
		return skillIndex;
	}

	skillBenefit(jobId) {
		let benefit = [0.7,1.0,1.3,1.6];

		console.assert( typeof jobId == 'string' );
		let skillIndex = this.skillAt(jobId);

		console.assert( skillIndex>=0 && skillIndex<benefit.length );
		return benefit[skillIndex];
	}

	moraleForJobType(jobType) {
		let skillBenefit	= this.skillBenefit(jobType.id);
		let wisdom			= this.community.getWisdom(jobType);
		// We take the min here so that very small populations don't benefit unduly from the
		// problem of small numbers.
		let impact			= Math.min( jobType.workerImpact, this.community.population );

		return (skillBenefit+wisdom) * impact;
	}

	moraleForAspect(aspectId) {
		// Notice that even if I'm doing something else, I still produce
		// the morale associated with my main job.
		if( this.surrogate && this.surrogate[aspectId] ) {
			let surrogatesDiminish = 0.80;
			return this.moraleForJobType( this.surrogate[aspectId] ) * surrogatesDiminish;
		}

		if( this.jobType.produces.id != aspectId ) {
			return 0;
		}
		return this.moraleForJobType( this.jobType );
	}
	productionBaselineForJob(jobId) {
		let skillBenefit	= this.skillBenefit(jobId);
		let impact			= JobTypeHash[jobId].workerImpact;
		return skillBenefit * impact;
	}
	productionSkillImpact() {
		let skillBenefit	= this.skillBenefit(this.jobType.id);
		let wisdom			= this.community.getWisdom(this.jobType);
		let impact			= this.jobType.workerImpact;
		return (skillBenefit+wisdom) * impact;
	}
	productionForAspect(aspectId) {
		if( this.jobFocus.produces.id !== aspectId ) {
			return 0;
		}

		let skillBenefit	= this.skillBenefit(this.jobFocus.id);
		let wisdom			= this.community.getWisdom(this.jobFocus);
		let wellbeing		= this.wellbeing;
		let morale			= this.community.morale;
		let impact			= this.jobFocus.workerImpact;

		let productivity = (skillBenefit+wisdom)*0.5 + (morale)*0.5 * wellbeing;

		return productivity * impact;
	}
	produce(gatherFn) {
		console.assert(gatherFn);
		let amount = this.productionForAspect( this.jobFocus.produces.id );
		return gatherFn( this.jobFocus.produces.id, amount );
	}
	tick(dt) {
		this.habit.tick(dt);
	}
}

Person.Stats = Stats;

class PersonList extends ListManager {
	constructor(validatorFn) {
		super(validatorFn);
	}
}

return {
	Person: Person,
	PersonList: PersonList
}

});
