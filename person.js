Module.add( 'person', ()=> {

let daysForGearToDie = 100;


class Stats {
	constructor() {
		this.list = Object.assign( {}, Stats.baseList );
		this.traverse( (stat,statId) => {
			stat.id = statId;
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

class Person {
	constructor(culture,community,jobType,venue,inject) {
		console.assert( culture && community && jobType && venue );
		console.assert( culture.isCulture && community.isCommunity && jobType.isJobType && venue.isVenue );
		this.isPerson	= true;
		this.culture	= culture;
		this.community	= community;
		this.jobType	= jobType;
		this.jobFocus	= this.jobType;
		this.id			= Date.makeUid();
		this.venue	= venue;
		venue.workerAdd(this);
		this.age		= culture.generateAge(jobType.isChild);
		this.gender		= culture.generateGender();
		this.nameFirst	= String.capitalize( this.culture.generateName(this.gender) );
		this._skillRating = {
			[jobType.id]: this.culture.generateSkillIndex()
		};
		this.stats		= new Stats();

		this.wounded	= false;
		this.diseased	= false;
		Object.assign( this, inject );
		if( this.isFemale ) {
			this._childList = this._childList || [];
			let maxChildren = Math.clamp( this.age-culture.marryingAge, 0, 4 );
			this.nominalChildren = maxChildren; //Math.randInt( 0, maxChildren );
		}
	}

	statGet(statId) {
		return this.stats.getRatio(statId);
	}
	statDaily(id) {
		this.stat[id]
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

	get family() {
		console.assert(false);
	}
	get allowAnotherKid() {
		console.assert( this.isFemale );
		return this.childList.length < this.nominalChildren;
	}
	canBeMotherOf(kid) {
		return (
			this !== kid &&
			this.isFemale &&
			this.age > kid.age+this.culture.marryingAge &&
			this.age < this.culture.menopauseAge+kid.age &&
			this.allowAnotherKid
		);
	}
	canBeHusbandOf(wife) {
		return (
			wife !== this &&
			this.gender=='M' &&
			!this.spouse &&
			!this.isSiblingOf(wife) &&
			this.culture.marryable(this) &&
			this.culture.spouseAgeMatch(this,wife)
		);
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
	get parentTitle() {
		return this.isFemale ? 'mother' : 'father';
	}
	get childTitle() {
		return this.isFemale ? 'daughter' : 'son';
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
		return this.spouse;
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
	get text() {
		if( this.isDead ) {
			let s = 'Dead person: '+this.textSummaryFull;
			if( this.isFemale ) {
				s += ' '+this.parentTitle+' of '+this.childCount;
			}
			else {
				s += ' husband of '+this.spouse.textSummary;
			}
			return s;
		}
		return 'Person: '+this.textSummaryFull+' the s'+this.skillAt(this.jobType.id)+' '+this.jobType.id+
			(this.isCalledBoss?' (boss)':'')+
			', produces '+Math.fixed(this.productionBaselineForJob(this.jobType.id),2)+' '+this.jobType.produces.id;
	}
	get textLineage() {
		if( !this.father ) {
			return this.textSummaryFull;
		}
		return this.textSummaryFull+', '+this.childTitle+' of '+this.father.textLineage;
	}
	get isCalledBoss() {
		return this.isBoss && this.venue.workerCount>1;
	}
	get name() {
		return this.nameFirst;
	}
	get nameLast() {
		return this.surname;
	}
	get nameFull() {
		return this.nameFirst+(this.nameLast ? ' '+this.nameLast : '');
	}
	get nameMaiden() {
		if( !this.isWife || !this.father ) {
			return;
		}
		return this.father.surname;
	}
	get isWidow() {
		return this.isFemale && this.spouse && this.spouse.isDead;
	}
	get isWidower() {
		return this.isMale && this.spouse && this.spouse.isDead;
	}
	get casualTitle() {
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
		if( this.age < 3 ) {
			return 'baby';
		}
		if( this.age < 7 ) {
			return 'toddler';
		}
		if( this.isGrandfather ) {
			return 'grandpa';
		}
		if( this.isGrandmother ) {
			return 'gramma';
		}

		return '';
	}
	_textSummaryMake(andLast) {
		let maidenName = this.nameMaiden;
		let title = this.casualTitle;
		return (title?title+' ':'')+
			this.nameFirst+
			(andLast ? ' '+this.nameLast+(maidenName ? ' (nee '+maidenName+')' : '') : '' )+
			' '+this.gender+this.age
		;
	}
	get textSummary() {
		return this._textSummaryMake();
	}
	get textSummaryFull() {
		return this._textSummaryMake(true);
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
		return this.isMale && this.spouse;
	}
	get isWife() {
		return this.isFemale && this.spouse;
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
	get childTitle() {
		return this.isMale ? 'son' : 'daughter';
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
				this.statGet('leisure'),
				this.statGet('sleep'),
				this.statGet('whole'),
				this.statGet('well')
			), 0, 1.0
		);
	}
	moraleForAspect(aspectId) {
		// Notice that even if I'm doing something else, I still produce
		// the morale  associated with my main job.
		if( this.jobType.produces.id != aspectId ) {
			return 0;
		}
		let skillBenefit	= this.skillBenefit(this.jobType.id);
		let wisdom			= this.community.getWisdom(this.jobType);
		let wellbeing		= this.wellbeing;
		let impact			= this.jobType.workerImpact;

		return (skillBenefit+wisdom) * wellbeing * impact;
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
		let amount = this.productionForJob( this.jobFocus );
		return gatherFn( this.jobFocus.produces.id, amount );
	}
}

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
