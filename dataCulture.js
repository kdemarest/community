Module.add('dataBasics',function() {


class NameRepo {
	constructor(nameList) {
		console.assert(nameList);
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
	constructor(namesMale,namesFemale) {
		this.maleRepo   = new NameRepo(namesMale);
		this.femaleRepo = new NameRepo(namesFemale);
	}
	validate(nameFirst,genderLetter) {
		let src = genderLetter=='M' ? this.maleRepo.nameList : this.femaleRepo.nameList;
		let n = src.find( name => name==nameFirst );
		console.assert(n);
	}
	pickUnique(genderLetter) {
		console.assert( String.validGender(genderLetter) );
		return genderLetter=='M' ? this.maleRepo.pickUnique : this.femaleRepo.pickUnique;
	}
}

class CultureBase {
	constructor(nameFirstHash,nameLastList) {
		this.isCulture = true;

		this.nameRepo = new NameRepoGendered(nameFirstHash.male,nameFirstHash.female);
		this.surnameRepo = new NameRepo(nameLastList);
//			['smith','jones','johnson','white','pickens','bivens','taylor','parker','jones','brown','black','fielding','williams','johnson','davies','evans','thomas','roberts','walker','wright','robinson','thompson','hughes','edwards','green','lewis','wood','harris','martin','jackson','clarke'].map( n => String.capitalize(n) )
//		);

		this.ageOfMajority = 18;
		this.marryingAge = 18;
		this.menopauseAge = 58;
		this.maxAge = 70;
		this.spouseAgeRange = 8;
		this.centroidAge = 25;

		this.populationPercentWomen = 0.55;

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

	getRespect(person) {
		let wealthLookup = {
			none: 0,
			low: 1000,
			medium: 2000,
			high: 3000
		}
		let n = wealthLookup[person.wealth||'none'];

		n += (person.jobType.respectBonus||0);

		if( person.isHusband ) n += 500;
		else if( person.isWife ) n += 400;
		else if( person.isWidow || person.isWidower ) n += 300;
		
		n += person.age;

		return n;
	}

	hostMayAccomodate(host,person) {
		if( host.isMarried && ((host._inMyHouse||0)+(host.spouse._inMyHouse||0) >= 1 ) ) {
			return false;
		}
		return person.gender==host.gender &&
			!person.isMarried &&
			( !person.isDomestic || !host.isDomestic ) &&
			(host.isSingle || host.isWidow || host.isWidower) &&
			!host.hasMinorChildren &&
			(!host.houseAtWorkplaceIfSingle && !person.houseAtWorkplaceIfSingle) &&
			host.culture.singleCohabitAgeMatch(host,person)
		;
	}

	canBeMotherOf(person,kid) {
		return (
			person !== kid &&
			person.isFemale &&
			person.age > kid.age+person.culture.marryingAge &&
			person.age < person.culture.menopauseAge+kid.age &&
			person.allowAnotherKid
		);
	}
	canBeHusbandOf(person,wife) {
		return (
			wife !== person &&
			person.gender=='M' &&
			!person.spouse &&
			!person.isSiblingOf(wife) &&
			person.culture.marryable(person) &&
			person.culture.spouseAgeMatch(person,wife) &&
			( !wife.isDomestic || !person.isDomestic )
		);
	}

	validateNameFirst(nameFirst,gender) {
		this.nameRepo.validate(nameFirst,gender);
	}

	generateName(genderLetter) {
		console.assert( String.validGender(genderLetter) );
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
		return Math.fChance(this.populationPercentWomen) ? 'F' : 'M'; //['M','F'][Math.randInt(0,2)];
	}
	generateSkillIndex() {
		let skillChoice = [0,0,1,1,1,1,1,2,2,3];
		// 20% spazzes
		// 50% normals
		// 20% capable
		// 10% excellent
		return skillChoice[Math.randInt(0,skillChoice.length)];
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
