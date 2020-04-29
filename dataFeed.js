Module.add( 'dataFeed', ()=>{

let DataFeed = {};

DataFeed.Base = class {
	update() {
	}
}

DataFeed.Wellbeing = class extends DataFeed.Base {
	constructor(community) {
		super();
		this.community = community;
		this.wbHash = {
			starving: {
				statId: 'food',
				icon: 'icons/food.png'
			},
			thirsty: {
				statId: 'water',
				icon: 'icons/water.png'
			},
			overworked: {
				statId: 'leisure',
				icon: 'icons/leisure.png'
			},
			homeless: {
				statId: 'sleep',
				icon: 'icons/household.png'
			},
			wounded: {
				statId: 'whole',
				icon: 'icons/wounded.png'
			},
			diseased: {
				statId: 'well',
				icon: 'icons/diseased.png'
			}
		};

		let rowIndex = 0;
		this.traverse( (wb,wbId) => {
			wb.id = wbId;
			wb.rowIndex = rowIndex++;
			wb.value = ()=> this.$wbValue[wbId];
		});

		this.info = {
			wb: null,
			rowIndex: null,
			text: ''
		};
		this.update();
	}
	update() {
		this.$foodStorage  = this.community.aspect.food.storageDays;
		this.$waterStorage = this.community.aspect.water.storageDays;
		this.$wbValue = {};
		this.traverse( wb => {
			this.$wbValue[wb.id] = 1-this.community.getStatAverage( wb.statId );
		});

		this.$worst = (() => {
			let w = { wbId: '', value: 1.0, rowIndex: null, icon: null };
			this.traverse( wb => {
				if( wb.value() < w.value ) {
					w.wbId		= wb.id;
					w.rowIndex	= wb.rowIndex;
					w.value		= wb.value();
					w.icon		= wb.icon
				}
			});
			return w;
		})();

	}
	traverse(fn) {
		return Object.each( this.wbHash, fn );
	}
	get infoBlank() {
		return !this.info.wb;
	}
	setInfo(wb,text) {
		this.info.wb = wb;
		this.info.rowIndex = wb ? wb.rowIndex : 0;
		this.info.text = text;
	}
	barrelText(rowIndex) {
		let temp = [
			this.$foodStorage,
			this.$waterStorage
		];
		return temp[rowIndex];
	}
	get worst() {
		return this.$worst;
	}
	get value() {
		return this.worst.value;
	}
	get icon() {
		return this.worst.icon || this.wbHash.starving.icon;
	}
}

DataFeed.Morale = class extends DataFeed.Base {
	constructor(community) {
		super();
		this.community = community;
		this.list = ['children','security','entertainment','leadership'];
		this.info = '';
		this.update();
	}
	update() {
		this.$moraleFrom = {};
		this.list.forEach( aspectId => {
			this.$moraleFrom[aspectId] = this.community.moraleForAspect(aspectId);
		});

		let total = 0;
		this.$rot = [];
		this.list.forEach( aspectId => {
			total += this.moraleFrom(aspectId);
			this.$rot.push(total);
		});
	}
	analyze(aspectId) {
		this.info = Math.percent(this.moraleFrom(aspectId))+'% from '+aspectId;
	}
	moraleFrom(aspectId) {
		return this.$moraleFrom[aspectId];
	}
	get value() {
		return this.rot(this.list.length-1);
	}
	get icon() {
		return this.value < 0 ? 'icons/moraleLow.png' : 'icons/morale.png';
	}
	rot(index) {
		return this.$rot[index];
	}
}

DataFeed.Productivity = class extends DataFeed.Base {
	constructor(community,dataMorale,dataWellbeing) {
		super();
		this.community = community;
		this.dataMorale = dataMorale;
		this.dataWellbeing = dataWellbeing;
		this.update();
	}
	update() {
		this.dataMorale.update();
		this.dataWellbeing.update();

		let skill		= this.community.getWeightedSkill();
		let morale		= this.dataMorale.value - 1;
		let wellbeing	= this.dataWellbeing.value;
		let gear		= this.community.aspect.gear.percentOperational - 1.0;
		let venue		= this.community.aspect.venue.percentOperational - 1.0;

		this.$total = [
			skill,
			skill+morale,
			skill+morale+wellbeing,
			skill+morale+wellbeing+gear,
			skill+morale+wellbeing+gear+venue
		];
	}
	get morale() {
		console.assert(false);
	}
	get moraleIcon() {
		return this.dataMorale.icon;
	}
	get wellbeing() {
		console.assert(false);
	}
	get wellbeingIcon() {
		return this.dataWellbeing.icon;
	}
	totals(index) {
		console.assert( index >=0 && index <=4 );
		return this.$total[index];
	}
};

return {
	DataFeed: DataFeed
}

});
