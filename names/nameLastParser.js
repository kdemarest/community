const fs = require('fs');

class NameLastParser {
	constructor(NameLast) {
		this.NameLast = NameLast;
		this.nameLastList = [];
	}
	load(countryCodeList,toFileFn) {
		countryCodeList.forEach( countryCode => {
			let nameData = fs.readFileSync(toFileFn(countryCode), 'utf8');
			let list = nameData.split('\n').map( s => s.trim() );
			list.forEach( nameLast => {
				if( nameLast ) {
					this.nameLastList.push( new this.NameLast( countryCode.toUpperCase(), nameLast ) );
				}
			});
		});
		return this.nameLastList;
	}
}

return module.exports = {
	NameLastParser: NameLastParser
}
