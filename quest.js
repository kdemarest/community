Module.add( 'quest', ()=>{

let Quest = {
	Data: {}
};

Quest.Validator = new class {
	constructor() {
		this.keywords = {
			quest: {
				castSetup: 1,
				appliesTo: 1,
				stateId: 1,
				stateHash: 1,
			},
			state: {
				Mark: 1,
				Journal: 1,
				Stage: 1,
				Advance: 1,
				onAdvance: 1,
				Revert: 1,
				onRevert: 1
			},
			cast: {
				Q: 1,
				Q2: 1,
				A: 1,
				onQ: 1,
				Ensure: 1,
				Give: 1,
				Take: 1,
				Reward: 1,
				Complete: 1,
				Prompt: 1
			}
		}
	}
	check(trail,type,k) {
		let keywords = this.keywords[type];
		if( !keywords[k] ) {
			throw 'Unknown keyword ['+k+'] in ['+trail+']';
		}
	}
	checkHash(trail,type,hash) {
		Object.each( hash, (obj,key) => {
			this.check(trail,type,key);
		});
	}
	validate(questId,questData) {
		this.checkHash( questId, 'quest', questData );
		Object.each( questData.stateHash, (state,stateId) => {
			Object.each( state, (entryValue,entryKey) => {
				let isOn		= String.startsWith(entryKey,'on');
				let isKeyword	= !String.isLowercase(entryKey.charAt(0));
				if( isKeyword || isOn ) {
					this.check( questId+'.stateHash.'+stateId, 'state', entryKey );
					if( isOn ) {
						console.assert( questData.stateHash[entryValue] );
					}
					return;
				}
				let castId = entryKey;
				let castEntryHashList = Array.assure(entryValue);
				castEntryHashList.forEach( (castEntryHash,index) => {
					this.checkHash( questId+'.stateHash.'+stateId+'.'+castId+'['+index+']', 'cast', castEntryHash ); 
				});
			});
		});
	}
}

Quest.list = [];

Quest.Base = class {
	constructor(giver,questDataId,questData,castFill) {
		Object.each( Quest.Data, (questData,questId) => Quest.Validator.validate(questId,questData) );

		Quest.list.push(this);

		this.id			= questDataId+'.'+Date.makeUid();
		this.questDataId = questDataId;
		this.giver		= giver;
		this.stateId	= null;
		this.stateHash	= Object.assign({},Object.clone(questData.stateHash));

		let castSetup = Object.assign( {}, Object.clone(questData.castSetup), castFill );
		this.castHash = this.castResolve( giver, Object.assign({},castSetup,{giver:giver}) );
		this.beenInState = {};
		this.__player  = null;
		this.__speaker = null;
		this.stateEnter( questData.stateId || 'intro' );
	}
	get player() {
		return this.__player;
	}
	get journal() {
		return this.player.journal;
	}
	//
	// Cast
	//
	castResolve(giver,castSetup) {
		let castHash = {};
		Object.each( castSetup, (valueOrFn,castId) => {
			if( valueOrFn === null ) {
				throw 'Error key '+castId+' was not filled at quest inception.';
			}
			castHash[castId] = typeof valueOrFn === 'function' ? valueOrFn(this.context) : valueOrFn;
			if( !castHash[castId] ) {
				throw "Unable to fill cast ["+castId+"] in "+this.questDataId;
			}
		});
		return castHash;
	}
	castTraverse(fn) {
		return Object.each( this.castHash, fn );
	}
	castIncludes(member) {
		return Object.find( this.castHash, m => m===member );
	}
	castFindId(member) {
		return Object.findKey( this.castHash, m => m===member );
	}
	//
	// State
	//
	stateTraverse(fn) {
		return Object.each( this.stateHash, fn );
	}
	get state() {
		return this.stateHash[this.stateId];
	}
	get stateIsRepeat() {
		return this.beenInState[this.stateId];
	}
	stateEnter(stateId,isRevert) {
		if( !stateId || stateId == this.stateId ) {
			return false;
		}

		if( this.stateId ) {
			if( this.journal.stageExists(this.id,this.stateId) ) {
				this.journal.stageSetDone(this.id,this.stateId,!isRevert);
			}
		}

		console.assert(stateId && typeof(stateId=='string'));
		this.stateId = stateId;
		console.assert(this.state);
		if( this.state.Journal ) {
			// Add should allow, and ignore, duplicate journal entries.
			this.journal.add( this.id, this.resolve(this.state.Journal) );
		}
		if( this.state.Stage ) {
			// Add should allow, and ignore, duplicate journal entries.
			this.journal.stageAdd( this.id, this.stateId, this.resolve(this.state.Journal) );
		}
		if( this.state.Mark ) {
			let castId = this.resolve(this.state.Mark);
			this.journal.mark( this.id, this.castHash[castId] );
		}
		if( this.state.Complete ) {
			this.journal.complete( this.id );
		}
		if( this.state.Reward ) {
			this.journal.stageAdd( this.id, 'reward', this.resolve(this.state.Reward) );
		}
	}
	get context() {
		let context			= Object.assign( {}, this.castHash );
		context.me			= this.__speaker;
		context.player		= this.__player;
		context.pickPerson	= this.pickPerson.bind(this);
		return context;
	}
	//
	// Pick
	//
	pickItem(fn) {
		return 'cinnamon';
	}
	get personList() {
		return this.giver.community.personList;
	}
	pickPerson(fnList) {
		let person;
		fnList = Array.assure(fnList);
		fnList.every( fn => {
			person = this.personList.pick( person => !this.castIncludes(person) && fn(person) );
			return !person;
		});
		return person;
	}
	journalFail() {
		this.failed = true;
		this.player.journal.fail( this.id );
	}
	testFailure() {
		let failed = false;
		this.castTraverse( cast => {
			if( cast.isDead ) {
				failed = true;
			}
		});
		if( failed ) {
			this.journalFail();
		}
	}
	resolve(valueOrFn) {
		return typeof valueOrFn === 'function' ? valueOrFn(this.context) : valueOrFn;
	}
	getDialogEntries(player,speaker,gatherFn) {
		if( player.journal.isComplete(this.id) ) {
			return;
		}
		this.__player  = player;
		this.__speaker = speaker;
		let castId	= this.castFindId(speaker);
		console.assert(castId);
		let state = this.state;
		// Maybe I don't have any conversation for this person...
		if( !state[castId] ) {
			return null;
		}
		let dialog = state[castId];

		let dialogList = Array.assure( state[castId] );
		dialogList.forEach( dialog => {
			let result = {
				stateId: this.stateId,
				quest: this
			};

			let addChoice = (text,newStateId,say) => {
				let choice = {
					quest:		this,
					domClass:	'dialogChoice',
					id:			this.id+'.'+this.stateId+'.'+Date.makeUid(),
					from:		this.stateId,
					text:		text,
					said:		this.beenInState[newStateId],
					newStateId:	newStateId,
					say: 		say
				}
				gatherFn( choice );
			}

			addChoice(
				this.resolve( this.stateIsRepeat && dialog.Q2 ? dialog.Q2 : dialog.Q ),
				this.resolve( dialog.onQ ),
				this.resolve( dialog.A )
			);
		});
	}
	// Selection expects to have a 'pickedId' within it.
	select(reply) {
		this.beenInState[reply.from] = true;
		let newStateId = reply.newStateId;
		this.stateEnter( newStateId );
	}
	tick(dt) {
		this.testFailure();
		if( this.failed ) return;

		if( this.state.Advance ) {
			let newStateId = this.resolve(this.state.Advance) ? this.resolve(this.state.onAdvance) : this.stateId;
			this.stateEnter(newStateId);
		}
		if( this.state.Revert ) {
			let newStateId = this.resolve(this.state.Revert) ? this.resolve(this.state.onRevert) : this.stateId;
			this.stateEnter(newStateId,true);
		}

	}
}

Quest.Data.Fetch = {
	castSetup: {
		giver:	null,
		item:	null,	// Means you must provide one
		person:	c=>c.pickPerson([
			p=>p.jobType.id=='grocer',
			p=>p.jobType.produces.id=='food',
			p=>p.isAlive
		])
	},
	appliesTo: entity=>entity.isPerson,	// so, could be an item etc.
	stateId: 'intro',
	stateHash: {
		intro: {
			giver: {
				Q:	'Do you enjoy cooking?',
				Q2:	c=>'Do you still need that '+c.item+'?',
				A:	c=>'Yes! I need some '+c.item+' for my pantry. Can you get it?',
				onQ: 'invite'
			},
		},
		invite: {
			giver: [
				{	Q: 'I will get it, no problem',
					A:	c=>'Great! Just go visit '+c.person.nameFull+' and get it.',
					onQ: 'start'
				},
				{	Q: 'Perhaps another time.',
					onQ: 'intro'
				}
			]
		},
		start: {
			Mark:		'person',
			Journal:	c=>'Fetch '+c.item+' for '+c.me.nameFull+'.',
			Stage:		c=>'Visit '+c.person.nameFull+'.',
			Advance:	c=>c.player.has(c.item),
			onAdvance:	'gotIt',
			giver: {
				Prompt:	c=>'Do you have that '+c.item+' for me yet?',
			},
			person: {
				Ensure: c=>!c.person.has(c.item) ? c.person.inventory.add(c.item) : null,
				Q:	c=>c.giver.nameFull+' would like some '+c.item+'.',
				A:	'Oh, yes I do. Here you go!',
				Give: c=>c.player.inventory.add(c.item),	// comes with an automatic note tht you got it
				onQ: 'gotIt'
			}
		},
		gotIt: {
			Mark:		'giver',
			Stage:		c=>'Return to '+c.giver.nameFull+'.',
			Revert:		c=>!c.player.has(c.item),
			onRevert:	'start',
			giver: {
				Q: c=>'I have the '+c.item+' for you.',
				A: 'Oh thank you so much!',
				Take: c=>c.player.inventory.remove(c.item),	// You get a message
				Reward: 'Here is some money.',
				Complete: true
			}
		}
	}
}

return {
	Quest: Quest
}

});
