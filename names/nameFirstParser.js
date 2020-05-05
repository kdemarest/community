
const fs = require('fs');

//let countryList = [
//'Great Britain','Ireland','USA','Italy','Malta','Portugal','Spain','France','Belgium','Luxembourg','the Netherlands','East Frisia','Germany','Austria','Switzerland','Iceland','Denmark','Norway','Sweden','Finland','Estonia','Latvia','Lithuania','Poland','Czech Republic','Slovakia','Hungary','Romania','Bulgaria','Bosnia and Herzegovina','Croatia','Kosovo','Macedonia','Montenegro','Serbia','Slovenia','Albania','Greece','Russia','Belarus','Moldova','Ukraine','Armenia','Azerbaijan','Georgia','Kazakhstan/Uzbekistan,etc.','Turkey','Arabia/Persia','Israel','China','India/Sri Lanka','Japan','Korea','Vietnam','other countries'
//];

let genderToss = {
	'=': true,
}
let genderHash = {
	'M': ['M'],
	'M?': ['M'],
	'?M': ['M'],
	'1M': ['M'],
	'?': ['M'],
	'F': ['F'],
	'F?': ['F'],
	'?F': ['F'],
	'1F': ['F'],
};

class NameFirstParser {
	constructor(NameFirst) {
		this.NameFirst = NameFirst;
		this.colSortNuance = 29;
		this.colCountry    = 30;
		this._lineNum = 0;
		this._raw  = '';
		this.countryCodeCount = {};
		this.countryCodeUniques = {};
		this.result = null;
	}
	check( value, note ) {
		if( !value ) {
			console.log('failure in line',this._lineNum,' ',note);
			console.log(this._raw);
			throw "halted";
		}
	}
	getFrequency(c) {
		if( c === ' ' || c == '' ) {
			return false;
		}
		let freq = 'DBCA987654321';
		let n = freq.indexOf(c);
		this.check( n>=0, 'unknown frequency code ['+c+']' );
		return n;
	}
	getGenderList(g) {
		this.check( genderHash[g], 'unknown gender code '+g );
		return genderHash[g];
	}
	parseLine(raw) {

		let countryCodeList = [
			'GB','IE','US','IT','MT','PT','ES','FR','BE','LU','NL','G2','DE','AT','CH','IS','DK','NO','SE','FI','EE',
			'LV','LT','PL','CZ','SK','HU','RO','BG','BA','HR','K2','MK','ME','RS','SI','AL','GR','RU','BY','MD','UA',
			'AM','AZ','GE','KZ','TR','IQ','IL','CN','IN','JP','KR','VN','X1'
		];

		let nameEquivs = raw.sub(3,29-3).trim();
		let parts = nameEquivs.split(' ');
		let nameFirstComplex = parts[0].replace('+',' ');	// Yes, I'm discarding the informal equivalents.
		let nameFirst = nameFirstComplex.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		let genderTag = raw.sub(0,3).trim();

		if( genderToss[genderTag] ) {	// means this name is an informal equivalent
			return null;
		}

		if(nameFirst.match( /[^'a-zA-Z- ]/g ) ) {
			return null;
		}

		let countryCodeHash = {};
		for( let i=0 ; i<countryCodeList.length ; ++i ) {
			let freqCode = raw.sub(this.colCountry+i,1);

			let frequency = this.getFrequency(freqCode);
			if( frequency === false ) {
				//console.log('skip '+countryCodeList[i]);
				continue;
			}
			countryCodeHash[countryCodeList[i]] = frequency;
			this.countryCodeCount[countryCodeList[i]] = (this.countryCodeCount[countryCodeList[i]]||0)+1;
		}
		if( Object.keys(countryCodeHash).length == 1 ) {
			let country = Object.keys(countryCodeHash)[0];
			this.countryCodeUniques[country] = (this.countryCodeUniques[country]||0)+1;
		}
		let genderList = this.getGenderList( genderTag );
		let name = new this.NameFirst( nameFirst, genderList, countryCodeHash );

		return name;
	}
	load(fileName,limit) {
		let result = [];
		let skipCount = 0;

		let nameData = fs.readFileSync(fileName, 'utf8');
		//console.log(nameData.length);
		this._lineNum = -1;
		let index = 0;
		while( index < nameData.length ) {
			++this._lineNum;
			let end = nameData.indexOf('$\r\n',index);
			this._raw = nameData.sub(index,end-index).trim();
			index = end+3;

			// Skip comments
			if( this._raw.sub(0,1) == '#' ) {
				continue;
			}

			// skip names with weird characters
			if( this._raw.indexOf('<') >= 0 ) {
				++skipCount;
				continue;
			}

			let name = this.parseLine( this._raw );
			if( !name ) {
				++skipCount;
				continue;
			}
			//console.log(name);
			result.push(name);
			if( limit && result.length > limit ) { break; }
		}
		this.skipCount = skipCount;

		let temp = {};
		let resultUniques = Object.values( result.filter( name => temp[name.nameFirst] ? false : temp[name.nameFirst] = true ) );
		let sorted = resultUniques.sort( (a,b) => a.nameFirst < b.nameFirst ? -1 : a.nameFirst > b.nameFirst ? 1 : 0 );

		this.result = sorted;
		return this.result;
	}

	stats() {
		console.log('Number of Names Found Per Country');
		console.log(this.countryCodeCount);
		console.log('Number of Names Unique to each Country');
		console.log(this.countryCodeUniques);
		console.log('Found:',this.result.length);
		console.log('Skipped',Math.floor((this.skipCount/(this.result.length+this.skipCount))*100),'%');
	}
}

return module.exports = {
	NameFirstParser: NameFirstParser
}
