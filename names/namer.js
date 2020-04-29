const fs 		= require('fs');
const NameFirst = require('./nameUtilities').NameFirst;
const NameLast  = require('./nameUtilities').NameLast;
const NameFirstParser = require('./nameFirstParser').NameFirstParser;
const NameLastParser  = require('./nameLastParser').NameLastParser;

console.assert = (value)=>{
	if( !value ) {
		console.trace('assert failed');
		throw "Assert Failed";
	}
}

class NameProcessor {
	constructor(nameList) {
		console.assert(nameList);
		this.nameList = nameList.slice();
	}
	get length() {
		return this.nameList.length;
	}
	map(fn) {
		return this.nameList.map(fn);
	}
	filter(fn) {
		let result = this.nameList.filter( fn );
		this.nameList = result;
		return this;
	}
	convert(...args) {
		this.nameList.forEach( name => {
			args.forEach( pair => {
				name.value = name.value.replace( pair[0], pair[1] );
			});
		});
		return this;
	}
	sort() {
		let sorted = this.nameList.sort( (a,b) => a.value < b.value ? -1 : a.value > b.value ? 1 : 0 );
		this.nameList = sorted;
		console.log('sorted=',this.nameList.length);
		return this;
	}
	unique() {
		let temp = {};
		this.nameList = Object.values( this.nameList.filter( name => temp[name.value] ? false : temp[name.value] = true ) );
		console.log('unique=',this.nameList.length);
		//console.log('*************************',this.nameList,'===================================');
		return this;
	}
	composite(fn) {
		let result = [];
		this.nameList.forEach( name => result.push( fn(name) ) );
		return result
	}
};

class Maker {
	constructor(repo,id) {
		console.assert( repo );
		console.assert( id );
		this.repo = repo;
		this.id = id;
	}
	get firstNamesJsonByGender() {
		console.assert( this.nameFirstList );
		let nameFirstList = this.nameFirstList;
		console.assert( nameFirstList );

		let male   = new NameProcessor(nameFirstList).filter( name => name.male );
		let female = new NameProcessor(nameFirstList).filter( name => name.female );

		let s = '{\nmale: [\n$MALE$\n],\nfemale: [\n$FEMALE$\n]\n}';
		s = s.replace( '$FEMALE$', female.composite( name => "'"+name.nameFirst+"'" ).join(',\n') );
		s = s.replace( '$MALE$',     male.composite( name => "'"+name.nameFirst+"'" ).join(',\n') );

		return 'Name.'+this.id+'First = '+s;
	}
	get lastNamesJson() {
		let nameLastList = this.nameLastList;
		let s = '[\n'+this.nameLastList.map( name => "'"+name.value+"'" ).join(',\n')+'\n]\n';

		return 'Name.'+this.id+'Last = '+s;

	}
};

Maker.gnome = class extends Maker {
	constructor(repo) {
		super(repo,'gnome');
	}
	get nameFirstList() {
		this._nameFirstList = this._nameFirstList || new NameProcessor(this.repo.nameFirstList)
			.filter( name => name.hasCountry('KR') )
			.convert( [/y/g,'th'], [/Y/g,'Th'], [/o/g,'y'], [/ng/g,'nk'], [/u/g,'a'], [/w/g,'o'], [/ae/g,'ow'], [/i/g, 'ar'] )
			.unique()
			.sort()
			.nameList
		;
		return this._nameFirstList;
	}
	get nameLastList() {
		this._nameLastList = this._nameLastList || (() => {
			let prefix = 'rat,mouse,rock,stone,knuckle,elbow,brow,jam,mud,gravel,cap,tin,tool,barrow,screw,toe,wrench,lip,nose'.split(',');
			let body = 'splinter,jam,toss,crack,sniff,waver,flail,hat,stub,lick,cap,brim,brow,grip,trip,spot,drag,wrinkle,sigh,huff,tap,rash'.split(',')
			let list = [];
			body.forEach( b => prefix.forEach( p => list.push( new NameLast( 'G!', String.capitalize(p)+b ) ) ) );
			return new NameProcessor( list );
		})();
		return this._nameLastList;
	}
}

Maker.human = class extends Maker {
	constructor(repo) {
		super(repo,'human');
	}
	get nameFirstList() {
		this._nameFirstList = this._nameFirstList || new NameProcessor(this.repo.nameFirstList)
			.filter( name => name.hasCountry('GB') )
			.unique()
			.sort()
		;
		return this._nameFirstList;
	}
	get nameLastList() {
		this._nameLastList = this._nameLastList || new NameProcessor(this.repo.nameLastList)
			.filter( name => name.hasCountry('GB') )
			.unique()
			.sort()
		;
		return this._nameLastList;
	}
}


function main() {

	let nameLastCountryList = 'cn,cz,de,es,eus,fr,gb,gk,hi,ie,il,it,kr,ne,pl,pt,ru,us'.split(',');

	let repo = {
		nameFirstList: new NameFirstParser(NameFirst).load('namesFirst.txt',null),
		nameLastList: new NameLastParser(NameLast).load(nameLastCountryList, c=>c+'.txt')
	};
	//nameParser.stats();

	let gnome = new Maker.gnome(repo);
	//console.log( gnome.firstNamesJsonByGender );
	console.log( gnome.nameLastList.length );
	console.log( gnome.lastNamesJson );

	//let human = new Maker.human(repo);
	//console.log( human.firstNamesJsonByGender );
	//console.log( human.lastNamesJson );
}

main();