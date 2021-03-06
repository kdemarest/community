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
			homeless: {
				statId: 'sleep',
				icon: 'icons/household.png'
			},
			overworked: {
				statId: 'leisure',
				icon: 'icons/leisure.png'
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
			let statValue = 1-this.community.getStatAverage( wb.statId );
			this.$wbValue[wb.id] = statValue;
		});

		this.$worst = (() => {
			let w = { wbId: '', value: 0.0, rowIndex: null, icon: null };
			this.traverse( wb => {
				if( wb.value() > w.value ) {
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
		this.list = ['family','security','entertainment','leadership'];
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
		let wellbeing	= -this.dataWellbeing.value;
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

DataFeed.City = class extends DataFeed.Base {
	constructor(community) {
		super();
		this.community	= community;
		this.info		= '';
		this.zoom		= 1.0;
		this.center		= { x:0, y:0 };
		this.personHide	= false;
		this.structureRadiusHide	= true;
		this.districtHide			= true;
	}
	zoomAdjust(value) {
		this.zoom = Math.clamp( this.zoom + value*0.005, 0.2, 12.0 );
	}
	structureTraverse(fn) {
		return this.community.structureTraverse(fn);
	}
	get district() {
		return this.community.districtHash;
	}
	get person() {
		return this.community.personList;
	}
	pan(dx,dy) {
		this.center.x += dx;
		this.center.y += dy;
	}
	update() {
	}
	setInfo(text) {
		this.info = text;
	}
	get clock() {
		return this.community.clock;
	}
	get textClock() {
		return this.community.clock.textFormatted({d:1,h:1,m:1});
	}
}

return {
	DataFeed: DataFeed
}

});
