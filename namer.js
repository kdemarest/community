const fs 		= require('fs');


let countryCodeList = [
'GB','IE','US','IT','MT','PT','ES','FR','BE','LU','NL','G2','DE','AT','CH','IS','DK','NO','SE','FI','EE',
'LV','LT','PL','CZ','SK','HU','RO','BG','BA','HR','K2','MK','ME','RS','SI','AL','GR','RU','BY','MD','UA',
'AM','AZ','GE','KZ','TR','IQ','IL','CN','IN','JP','KR','VN','X1'
];

let countryCodeToName = {
	GB: 'Great Britain',
	IE: 'Ireland',
	US: 'USA',
	IT: 'Italy',
	MT: 'Malta',
	PT: 'Portugal',
	ES: 'Spain',
	FR: 'France',
	BE: 'Belgium',
	LU: 'Luxembourg',
	NL: 'Netherlands',
	G2: 'East Frisia',
	DE: 'Germany',
	AT: 'Austria',
	CH: 'Switzerland',
	IS: 'Iceland',
	DK: 'Denmark',
	NO: 'Norway',
	SE: 'Sweden',
	FI: 'Finland',
	EE: 'Estonia',
	LV: 'Latvia',
	LT: 'Lithuania',
	PL: 'Poland',
	CZ: 'Czech Republic',
	SK: 'Slovakia',
	HU: 'Hungary',
	RO: 'Romania',
	BG: 'Bulgaria',
	BA: 'Bosnia',
	HR: 'Croatia',
	K2: 'Kosovo',
	MK: 'Macedonia',
	ME: 'Montenegro',
	RS: 'Serbia',
	SI: 'Slovenia',
	AL: 'Albania',
	GR: 'Greece',
	RU: 'Russia',
	BY: 'Belarus',
	MD: 'Moldova',
	UA: 'Ukraine',
	AM: 'Armenia',
	AZ: 'Azerbaijan',
	GE: 'Georgia',
	KZ: 'Kazakhstan',
	TR: 'Turkey',
	IQ: 'Iraq',
	IL: 'Israel',
	CN: 'China',
	IN: 'India/Sri Lanka',
	JP:	'Japan',
	KR: 'Korea',
	VN: 'Vietnam',
	X1: 'other countries',
};

//let countryList = [
//'Great Britain','Ireland','USA','Italy','Malta','Portugal','Spain','France','Belgium','Luxembourg','the Netherlands','East Frisia','Germany','Austria','Switzerland','Iceland','Denmark','Norway','Sweden','Finland','Estonia','Latvia','Lithuania','Poland','Czech Republic','Slovakia','Hungary','Romania','Bulgaria','Bosnia and Herzegovina','Croatia','Kosovo','Macedonia','Montenegro','Serbia','Slovenia','Albania','Greece','Russia','Belarus','Moldova','Ukraine','Armenia','Azerbaijan','Georgia','Kazakhstan/Uzbekistan,etc.','Turkey','Arabia/Persia','Israel','China','India/Sri Lanka','Japan','Korea','Vietnam','other countries'
//];

class Name {
	constructor(nameFirst,genderList,countryCodeHash) {
		this.male = genderList[0] == 'M' || genderList[1] == 'M';
		this.female = genderList[0] == 'F' || genderList[1] == 'F';
		this.nameFirst = nameFirst;
		this.countryCodeHash = countryCodeHash;
	}
	hasCountry(...args) {
		let found = false;
		args.forEach( country => {
			if( this.countryCodeHash[country] || this.countryCodeHash[countryCodeToName[country]] ) {
				found=true;
			}
		});
		return found;
	}
}

Object.assign(String.prototype, {
    sub(index,len) {
        return this.substring(index,index+len);
    }
});

class NameParser {
	constructor() {
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
			'=': ['M','F']
		};
		this.check( genderHash[g], 'unknown gender code '+g );
		return genderHash[g];
	}
	parseLine(raw) {
		let nameEquivs = raw.sub(3,29-3).trim();
		let parts = nameEquivs.split(' ');
		let nameFirstComplex = parts[0].replace('+',' ');	// Yes, I'm discarding the informal equivalents.
		let nameFirst = nameFirstComplex.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

		if(nameFirst.match( /[^a-zA-Z ]/g ) ) {
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
		let genderList = this.getGenderList( raw.sub(0,3).trim() );
		let name = new Name( nameFirst, genderList, countryCodeHash );


		return name;
	}
	parseFile(fileName,limit) {
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
		let resultUniques = Object.values( result.filter( name => temp[name.nameFirst] = name ) );
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

class NameProcessor {
	constructor(nameList) {
		this.nameList = nameList.slice();
	}
	filter(fn) {
		let result = this.nameList.filter( fn );
		this.nameList = result;
		return this;
	}
	convert(...args) {
		this.nameList.forEach( name => {
			args.forEach( pair => {
				let nameFirst = name.nameFirst.replace( pair[0], pair[1] );
				name.nameFirst = nameFirst;
			});
		});
		return this;
	}
	sort() {
		let sorted = this.nameList.sort( (a,b) => a.nameFirst < b.nameFirst ? -1 : a.nameFirst > b.nameFirst ? 1 : 0 );
		this.nameList = sorted;
		return this;
	}
	composite(fn) {
		let result = [];
		this.nameList.forEach( name => result.push( fn(name) ) );
		return result
	}
};

class Maker {
	constructor(id,makeFn) {
		this.id = id;
		this.makeFn = makeFn;
		this.result = null;
	}
	make(...args) {
		return this.makeFn(...args);
	}
	toJsonByGender( nameListFirst ) {
		let male   = new NameProcessor(nameFirstList).filter( name => name.male );
		let female = new NameProcessor(nameFirstList).filter( name => name.female );

		let s = '{\nmale: [\n$MALE$\n],\nfemale: [\n$FEMALE$\n]\n}';
		s = s.replace( '$FEMALE$', female.composite( name => "'"+name.nameFirst+"'" ).join(',\n') );
		s = s.replace( '$MALE$',     male.composite( name => "'"+name.nameFirst+"'" ).join(',\n') );

		return 'Name.'+id+' = '+s;
	}
};

Maker.gnome = new Maker( 'gnome', (nameFirstList) => {
	let np = new NameProcessor(nameFirstList);
	np
		.filter( name => name.hasCountry('KR') )
		.convert( [/y/g,'th'], [/Y/g,'Th'], [/o/g,'y'], [/ng/g,'nk'], [/u/g,'a'], [/w/g,'o'], [/ae/g,'ow'], [/i/g, 'ar'] )
		.sort()
	;
	return this.result = np.result;
});

Maker.human = new Maker( 'human', (nameFirstList) => {
	let np = new NameProcessor(nameFirstList);
	np
		.filter( name => name.hasCountry('GB') )
		.sort()
	;
	return this.result = np.result;
});

function gather

function main() {
	let nameParser = new NameParser();
	let nameFirstList = nameParser.parseFile('namesFirst.txt',null);
	//nameParser.stats();

	//Maker.gnome.make(nameFirstList);
	//console.log( 'Name.gnome = '+toArrayByGender( gnomeNames.nameList ) );

	console.log( Maker.toJsonByGender( Maker.human.make(nameFirstList) ) );

}

main();