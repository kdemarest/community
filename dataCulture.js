Module.add('dataBasics',function() {


class NameRepo {
	constructor(nameList) {
		this.nameList = nameList;
		this.index = 0;
		this.shuffle();
	}
	shuffle() {
		Array.shuffle( this.nameList );
	}
	get pickUnique() {
		if( this.index >= this.nameList.length ) {
			this.shuffle();
			this.index = 0;
		}
		return this.nameList[this.index++];
	}
};

class NameRepoGendered {
	constructor(nameListGendered) {
		this.maleRepo = new NameRepo(nameListGendered.male);
		this.femaleRepo = new NameRepo(nameListGendered.female);
	}
	pickUnique(genderLetter) {
		return genderLetter=='M' ? this.maleRepo.pickUnique : this.femaleRepo.pickUnique;
	}
}

class CultureBase {
	constructor() {
		this.isCulture = true;

		this.nameRepo = new NameRepoGendered(Name.humanList);
		this.surnameRepo = new NameRepo(
			['smith','jones','johnson','white','pickens','bivens','taylor','parker','jones','brown','black','fielding','williams','johnson','davies','evans','thomas','roberts','walker','wright','robinson','thompson','hughes','edwards','green','lewis','wood','harris','martin','jackson','clarke'].map( n => String.capitalize(n) )
		);

		this.ageOfMajority = 18;
		this.marryingAge = 18;
		this.menopauseAge = 58;
		this.maxAge = 70;
		this.spouseAgeRange = 8;
		this.centroidAge = 25;

	}
	marryable(p) {
		return !p.spouse && p.age > this.marryingAge;
	}
	spouseAgeMatch(a,b) {
		let m = a.isMale ? a : b;
		let f = a.isFemale ? a : b;
		return f.age >= m.age-15 && f.age <= m.age+5;
	}
	singleCohabitAgeMatch(a,b) {
		let tolerance = a.age < 30 ? 6 : a.age < 40 ? 8 : a.age < 50 ? 10 : 15;
		return Math.abs(a.age-b.age) < tolerance;
	}
	chanceMarried(person) {
		return Math.fChance( 0.1 * Math.clamp(person.age-this.marryingAge,0,9) );
	}

	generateName(genderLetter) {
		return this.nameRepo.pickUnique(genderLetter);
	}
	generateSurname(firstName) {
		let surname = this.surnameRepo.pickUnique;
		if( surname == firstName ) {
			surname = this.surnameRepo.pickUnique;
		}
		return surname;
	}
	generateGender() {
		return Math.fChance(0.60) ? 'F' : 'M'; //['M','F'][Math.randInt(0,2)];
	}
	generateSkill() {
		let chanceForSpazz = 0.3;
		let skill = 3 - Math.floor( Math.sqrt( Math.rand(0,3*3) ) );	// 1-3
		if( skill == 1 && Math.fChance(chanceForSpazz) ) {
			skill = 0;
		}
		return skill;
	}
	generateAge(isChild) {
		let pickAge = (ageRange,min,max) => {
			let bell = () => ( Math.random()+Math.random()+Math.random() ) / 3;
			let n;
			let repsLimit2 = 200;
			do {
				let repsLimit = 200;
				while( --repsLimit ) {
					n = bell();
					let center = this.centroidAge/ageRange;
					let reroll = Math.abs(center-n) / (1-center);
					if( Math.pow(Math.random(),2) > reroll ) {
						break;
					}
				}
				console.assert( repsLimit );
			} while( (n<min/ageRange || n>max/ageRange) && --repsLimit2 );
			console.assert( repsLimit2 );
			return Math.floor(n*ageRange);
		}
		return isChild ? Math.randInt(0,this.ageOfMajority) : Math.randInt(this.ageOfMajority,this.maxAge); //pickAge(this.maxAge,this.ageOfMajority,this.maxAge);
	}
}

return {
	CultureBase: CultureBase
}

});
