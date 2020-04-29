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

Object.assign(String.prototype, {
    sub(index,len) {
        return this.substring(index,index+len);
    }
});

String.capitalize = function(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

class NameFirst {
	constructor(nameFirst,genderList,countryCodeHash) {
		this.male = genderList[0] == 'M' || genderList[1] == 'M';
		this.female = genderList[0] == 'F' || genderList[1] == 'F';
		this.nameFirst = nameFirst;
		this.countryCodeHash = countryCodeHash;
	}
	get value() {
		return this.nameFirst;
	}
	set value(v) {
		this.nameFirst = v;
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

class NameLast {
	constructor(countryCode,nameLast) {
		this.countryCode = countryCode.toUpperCase();
		this.nameLast = nameLast;
	}
	get value() {
		return this.nameLast;
	}
	set value(v) {
		this.nameLast = v;
	}
	hasCountry(countryCode) {
		return this.countryCode.toUpperCase() == countryCode.toUpperCase();
	}
}

return module.exports = {
	countryCodeToName: countryCodeToName,
	NameFirst: NameFirst,
	NameLast:  NameLast
}
