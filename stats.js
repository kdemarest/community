Module.add( 'stats', ()=> {

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

return {
	Stats: Stats
}

});
