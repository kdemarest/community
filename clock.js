Module.add( 'clock', ()=>{

Time.GameTime = class {
	constructor(time=0) {
		this.time = time;
	}
	set(value) {
		this.time = value;
	}
	get day() {
		return Math.floor(this.time/(24*60*60*1000));
	}
	get hour() {
		return Math.floor(this.time/(60*60*1000)) % 24;
	}
	get minute() {
		return Math.floor(this.time/(60*1000)) % 60;
	}
	get second() {
		return Math.floor(this.time/(1*1000)) % 60;
	}
	get milli() {
		return Math.floor(this.time) % 1000;
	}
	advanceDays(days) {
		this.time += days * 24*60*60*1000;
	}
	advanceHours(hours) {
		this.time += hours * 60*60*1000;
	}
	advanceMinutes(minutes) {
		this.time += minutes * 60*1000;
	}
	aheadMinutes(minutes) {
		return new Time.GameTime(this.time + minutes*(60*1000));
	}
	textFormatted(part) {
		console.assert(part);
		let s = '';
		if( part.d ) {
			s += String.padLeft(this.day,4)+'d';
		}
		if( part.h ) {
			s += (part.d?' ':'')+String.padLeft(this.hour,2,'0');
		}
		if( part.m ) {
			s += (part.h?':':'')+String.padLeft(this.minute,2,'0');
		}
		if( part.s ) {
			s += (part.m?':':'')+String.padLeft(this.second,2,'0');
		}
		return s;
	}
}

Time.Clock = class extends Time.GameTime {
	constructor(rate) {
		super(0);
		this.rate = rate * 60;
	}
	advance(dt) {
		this.time += dt * this.rate;
	}
	tick(dt) {
		this.advance(dt);
	}
}

return {
}

});
