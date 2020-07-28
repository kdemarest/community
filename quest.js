Module.add( 'quest', ()=>{

let Quest = {
	Data: {},
	hash: []
};

/*
Quest.Validator = new class {
	constructor() {
		this.keywords = {
			quest: {
				id: 1,
				castSetup: 1,
				mayGive: 1,
				stateId: 1,
				stateHash: 1,
				topic: 1,
			},
			state: {
				Mark:		'isCastMember',
				Journal:	'isTextOrFn',
				Stage:		'isTextOrFn',
				Advance:	'isCondition',
				Revert:		'isCondition',
			},
			entries: {
				Q: 'isTextOrFn',
				Q2: 'isTextOrFn',
				A: 'isTextOrFn',
				onQ: 'isState',
				Ensure: 1,
				Give: 1,
				Take: 1,
				Reward: 1,
				Complete: 1,
				Prompt: 1
			},
			castMember: {
				any: 'isCastMember'
			}
		}
	}

	check(questData,trail,classifier,key,value) {
		let what = ()=>'keyword ['+key+'] in ['+trail+'] value='+value;
		if( !classifier[key] ) {
			throw 'Unknown keyword '+what();
		}
		switch( classifier[key] ) {
			case 'isState':
				if( !questData.stateHash[value] ) {
					throw 'Bad state specified '+what();
				}
				break;
			case 'isTextOrFn':
				let t = typeof value;
				if( t!=='string' && t!=='function' ) {
					throw 'Must be string or function '+what();
				}
				break;
			case 'isCastMember':
				if( questData.castSetup[value] === undefined ) {
					throw 'Must specify a cast member '+what();
				}
				break;
			case 'isCondition':
				if( !Object.isObject(value) || !value.when || !value.goto ) {
					throw key+' must be object when: state: '+what();
				}
				if( !questData.stateHash[value.goto] ) {
					throw 'Bad state in second parameter '+what();
				}
				break;
		}
	}
	checkHash(questData,trail,classifier,hash) {
		Object.each( hash, (value,key) => {
			this.check(questData,trail,classifier,key,value);
		});
	}
	validate(questSpeciesId,questData) {
		questData.castSetup = questData.castSetup || {};
		questData.castSetup.giver = null;

		this.checkHash(
			questData,
			questSpeciesId,
			this.keywords.quest,
			questData
		);
		Object.each( questData.stateHash, (state,stateId) => {
			Object.each( state, (entryData,entryKey) => {
				let isSpeaker = String.isLowercase( entryKey.substring(0) );
				if( !isSpeaker ) {
					this.check(
						questData,
						questSpeciesId+'.stateHash.'+stateId,
						this.keywords.state,
						entryKey,
						entryData
					);
					return;
				}
				let speakerId = entryKey;
				let speakerHashList = Array.assure(entryData);
				this.check(
					questData,
					questSpeciesId+'.stateHash.'+stateId+'.'+speakerId,
					this.keywords.castMember,
					'any',
					speakerId
				);
				speakerHashList.forEach( (speakerEntryHash,index) => {
					this.checkHash(
						questData,
						questSpeciesId+'.stateHash.'+stateId+'.'+speakerId+'['+index+']',
						this.keywords.entries,
						speakerEntryHash
					); 
				});
			});
		});
	}
}

Quest.Base = class {
	constructor(giver,questId,questData,castFill) {
		this.id			= questId
		this.giver		= giver;
		this.stateId	= null;
		this.stateHash	= questData.stateHash;

		let castSetup = Object.assign( {}, Object.clone(questData.castSetup), castFill );
		this.castHash = this.castDetermineMembers( giver, Object.assign({},castSetup,{giver:giver}) );
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
	castDetermineMembers(giver,castSetup) {
		let castHash = {};
		Object.each( castSetup, (valueOrFn,castId) => {
			if( valueOrFn === null ) {
				throw 'Error key '+castId+' was not filled at quest inception.';
			}
			castHash[castId] = typeof valueOrFn === 'function' ? valueOrFn(this.context) : valueOrFn;
			if( !castHash[castId] ) {
				throw "Unable to fill cast ["+castId+"] in quest "+this.id;
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
		context.castItem	= this.castItem.bind(this);
		context.castPerson	= this.castPerson.bind(this);
		return context;
	}
	//
	// Casting
	//
	get personList() {
		return this.giver.community.personList;
	}
	castItem(fn) {
		return 'cinnamon';
	}
	castPerson(fnList) {
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
		this.stateEnter( reply.newStateId );
	}
	tick(dt) {
		this.testFailure();
		if( this.failed ) return;

		if( this.state.Advance ) {
			let when = this.resolve( this.state.Advance.when );
			if( when ) {
				let goto = this.resolve( this.state.Advance.goto );
				this.stateEnter(goto);
			}
		}
		if( this.state.Revert ) {
			let when = this.resolve( this.state.Advance.when );
			if( when ) {
				let goto = this.resolve( this.state.Advance.goto );
				this.stateEnter(goto);
			}
		}

	}
}

Quest.Determine = (person) => {
	let questHash = {};
	Object.each( Quest.Data, (questData,questSpeciesId) => {
		if( !questData.mayGive(person) ) {
			return;
		}

		let questId = questSpeciesId+'.'+person.id;
		let quest = Quest.hash[questId] || new Quest.Base(
			person,
			questId,
			questData,
			{ item: 'cinnamon' }
		);
		questHash[quest.id] = quest;	
	});

	// Maybe you are just a participant in this quest?
	Object.each( Quest.hash, quest => {
		if( quest.castIncludes(person) && !questHash[quest.id] ) {
			questHash[quest.id] = quest;
		}
	});
	return questHash;
};

Quest.Validate = () => {
	Object.each( Quest.Data, (questData,questSpeciesId) => 
		Quest.Validator.validate(questSpeciesId,questData)
	);
}



Quest.Data.Fetch = {
	mayGive: entity=>entity.isPerson,	// so, could be an item etc.
	setup: {
		cast: {
			giver:	null,
			item:	null,	// Means you must provide one
			person:	c=>c.castPerson([
				p=>p.jobType.id=='grocer',
				p=>p.jobType.produces.id=='food',
				p=>p.isAlive
			])
		},

	},
	stateId: 'intro',
	stateHash: {
		intro: {
			giver: {
				pl:	'Do you enjoy cooking?',
				p2:	c=>'Do you still need that '+c.item+'?',
				me:	c=>'Yes! I need some '+c.item+' for my pantry. Can you get it?',
				Offer: {
					Yes: 'I will get it, no problem.',
					No:  'Perhaps another time.',
					Announce: {
						say: c=>'Great! Just go visit '+c.person.text.nameFull+' and get it.',
						goto: 'start'
					}
				}
			},
		},
		start: {
			Mark:		'person',
			Journal:	c=>'Fetch '+c.item+' for '+c.me.text.nameFull+'.',
			Stage:		c=>'Visit '+c.person.text.nameFull+'.',
			Advance:	{
				when:	c=>c.player.has(c.item),
				goto:	'gotIt'
			},
			giver: {
				Prompt:	c=>'Do you have that '+c.item+' from '+c.person.text.nameFull+' yet?',
			},
			person: {
				Ensure: c=>!c.person.has(c.item) ? c.person.inventory.add(c.item) : null,
				Q:		c=>c.giver.text.nameFull+' would like some '+c.item+'.',
				A:		'Oh, yes I do. Here you go!',
				Give:	c=>c.player.inventory.add(c.item),	// comes with an automatic note tht you got it
				onQ:	'gotIt'
			}
		},
		gotIt: {
			Mark:		'giver',
			Stage:		c=>'Return to '+c.giver.text.nameFull+'.',
			Revert:		{
				when:	c=>!c.player.has(c.item),
				goto:	'start'
			},
			giver: {
				Q:		c=>'I have the '+c.item+' for you.',
				A:		'Oh thank you so much!',
				Take:	c=>c.player.inventory.remove(c.item),	// You get a message
				Reward:	'Here is some money.',
				Complete: true
			}
		}
	}
}
*/

Journal.Data.aBladeInTheDark = {
	rent:	{
		bullet: "Rent the Attic Room in Riverwood",
		detail: "Somebody got to the horn of Jurgen Windcaller before me. I need to meet them in Riverwood."
	},
	meet1:	{
		bullet: "Enter the room",
	},
	meet2: {
		bullet: "Meet Delphine",
	},
	find: {
		bullet: "Find Esbern in Riften"
	}
};

Quest.Data.tavernKeeper = {
	mayGive: 'delphine',
	cast: {
		giver: null,
	},
	priority: 'normal',
	stateHash: {
		BEGIN: [
			{ onTalk: 'giver', do: [
				{ pl: "I'd like to rent a room. (10 gold)" },
				{ change: 'player', gold: -10 },
				{ me: "Just take the room on the right." },
			]}
		]
	}
}

Quest.Data.aBladeInTheDark = {
	mayGive: entity=>entity.id == "delphine",
	cast: {
		// Possibly the player is always in the cast...
		giver:		'delphine',
		delphine:	'delphine',
		brynjolf:	'brynjolf',
		esbern:		'esbern',
		bedroom:	'bedroomSleepingGiantInn',
		delroom:	'delphinesRoom',
		delroomDoor:'delphinesRoomDoor',
		horn:		'hornOfJurgen',
		wardrobe:	'delphineWardrobe',
		bladeRoom:	'bladesHiddenRoom',
	},
	flag: {
		// This can't be calculated immediately, because you might improve your
		// stats and then return. So we calculate it on-demand, and re-use it
		// thereafter.
		brPersuade:	c=>c.player.persuade(50)
	},
	priority: 'quest',
	stateHash: {
		BEGIN: [
			{ journal: 'aBladeInTheDark', start: 'rent', mark: 'delphine' },
			{ onTalk: 'delphine', do: [
				{ priority: 'normal' },
				{ pl: "I'd like to rent the attic room. (10 gold)" },
				{ change: 'player', gold: -10 },
				{ me: "Attic room, eh? Well... we don't have an attic room, but you can have the one on the left. Make yourself at home." },
				{ exit: 'meet1' }
			]}
		],
		meet1: [
			{ script: 'tavernKeeper', disable: true },
			{ journal: 'aBladeInTheDark', done: 'rent', start: 'meet1', mark: 'bedroom' },
			{ onTick: 'delphine', do: [
				{ change: 'delphine', travelTo: 'bedroom' },
				{ await: [
					{ query: 'delphine', isAt: 'bedroom' },
					{ query: 'player', isAt: 'bedroom' }
				]},
				{ me: "So you're the Dragonborn I've been hearing so much about." },
				{ me: "I think you're looking for this." },
				{ change: 'player', give: 'horn' },
				{ me: "We need to talk. Follow me." },
				{ exit: 'meet2' }
			]}
		],
		meet2: [
			{ journal: 'aBladeInTheDark', done: 'meet1', start: 'meet2', mark: 'delroom' },
			{ onTick: 'delphine', do: [
				{ change: 'delphine', travel: 'delroom' },
				{ await: [
					{ query: 'delroom', isAt: 'delroom' },
					{ query: 'player', isAt: 'delroom' },
					{ query: 'delroomDoor', hasState: 'open' },
				]},
				{ me: "Close the door." },
				{ exit: 0 }
			]},
			{ onTick: 'delphine', do: [
				{ await: [
					{ query: 'delroomDoor', hasState: 'closed' }
				]},
				{ me: "Now we can talk." },
				{ goto: 'meet3' }
			]}
		],
		meet3: [
			{ journal: 'aBladeInTheDark', mark: 'bladeRoom' },
			{ change: 'wardrobe', setState: 'open' },
			{ change: 'delphine', travelTo: 'bladeRoom' },
			{ onTick: 'delphine', do: [
				{ await: [
					{ query: 'me', isAt: 'bedroom' },
					{ quest: 'player', isAt: 'bedroom' }
				]},
				{ me: "The greybeards seem to think you're the dragonborn. I hope they're right." },
				{ pl: "So what now?" },
				{ goto: 'find' }
			]}
		],
		find: [
			{ onEscape: 'delphine', do: [
				{ me: "You'll be back. If you're really Dragonborn this is your destiny." },
			]},
			{ onTalk: 'delphine', do: [
				{ me: "Go find Esbern." },
				{ exit: 0 }
			]},
			{ onResume: 'delphine', do: [
				{ me: "Have you found Esbern yet? Get to it!" },
			]},
			{ onTalk: 'esbern', do: [
				{ me: "You found me!" },
				{ exit: 'complete' }
			]},
			{ label: 'reveal', do: [
				{ me: "Yeah. I bet I know your guy. He's hiding out in the Ratway Warrens. Paying us good coin for nobody to know about it." },
				{ deadend: 1 }
			]},
			{ onTalk: 'brynjolf', do: [
				{ pl: "I'm looking for this old guy hiding out in Riften." },
				{ if: 1, journal: 'aChanceArrangement', stage: 'complete', do: [
					{ run: 'reveal' }
				]},
				{ me: "Expecting free information, eh? Help me deal with business first.\n"+
					  "Besides, you look like your pockets are a little light on coin, am I right?"
				},
				{ choice: "Let me find him first. Dragons are bad for business. (Persuade)", do: [
					{ if: 'brPersuade1', do: [
						{ me: "Aye, you've got a point there." },
						{ run: 'reveal' },
					],
					else: [
						{ me: "Passing on a golden opportunity is worse." },
						{ quest: 'aChanceArrangement', goto: 'getInstructions' }
					]}
				]},
				{ choice: "Hold on - I just wanted some information.", do: [
					{ me: "And I'm busy. You help me out, and I'll help you out. That's just how it is." },
					{ deadEnd: 1 },
				]},
				{ ask: 1 }
			]},
		],
		complete: [
			{ journal: 'aBladeInTheDark', complete: true },
			{ onTalk: 'delphine', do: [
				{ me: "Well done. I'm glad you found Esbern." },
				{ exit: 'complete' }
			]},
		]
	}
}

Journal.Data.miscellaneous = {
	listenBrynjolf: {
		bullet: "Listen to Brynjolf's Scheme"
	}
}

Journal.Data.aChanceArrangement = {
	meet:	{
		bullet: "Meet Brynjolf During Daytime",
	},
	steal:	{
		bullet: "Steal Madesi's Ring",
	},
	plant:	{
		bullet: "Plant Madesi's Ring on Brand-Shei",
	},
	speak:	{
		bullet: "Speak to Brynjolf"
	}
};

//===========================================================
//===========================================================
/*

cast: just the id's of anything - a person, an item, a site, etc.

stateHash: hash of states. Always gets an implicit state called 'complete' if not exists
<state>: array of sequential commands
	- onEvent: <who> <conditional> <finish> <do>(see below)

* onEvent specifies who it applies to, and may be
	- types are onEscape, onResume, onTick, onTalk
* conditionals, which can include not:1 include
	- query: (anyId)
		isAt (anyId)
		isState (some state)
		isSstage (some quest stage)
		has (itemId)
		lt: less than
		gt: greater than
	-change - just like any change statement. Will return True on success.
* finish can be
	- goto: <state>
	- exit - to stop processing and exit the dialog
	- deadend - to just stop processing but keep talking

* do [ sequence of commands ]

* commands include
	- journal - alters the journal with done, start and mark
	- pl: what the player says
	- me: what I say
	- if: any conditional... do: ... else: ...
	- choice: n adds a choice to the speech's list of player choices. can combine with "if"
	- ask: n stops adding choices and pauses execution until a choice is made
	- pick: choose one option for an array
	- change(anyId) - pick as target and does an operation upon them
		- ops are gold/amount, setState/st, give/itemId, travelTo/id, talkTo/whom etc.
	- await: [ list of conditionals ] all must be true to continue execution
	  we can even check whether, for example, a character is actually heading for a location...
	- goto 'state'. Clears the EVENT array for current state. (must always end a sequence)
	- exit 'state'  Just like goto, except the leaves the dialog
	- run 'label'. Runs the label named.

EVENTS implement as a great big array. If something has a label then it get kept
instead of getting immediately run.
journal | state | who | onEvent | label | condition | finish | do

COMMANDS also implement as a big array.

Each event keeps its own state.

*/



Quest.Data.aChanceArrangement = {
	mayGive: entity=>entity.id == "brynjolf",
	cast: {
		brynjolf:	'brynjolf',
		bStall:		'brynjolfStall',
		madesi:		'madesi',
		mStall:		'madesiStall',
		brandShei:	'brandShei',
		ring:		'madesiRing',	// auto found among all items
	},
	flag: {
		// these all go directly onto 'c'
		seekingEsbern:	c => c.quest.findEsbern.inProgress,
		framedMadesi:	c => c.quest.aChanceArrangement.complete,
		persuade1:		c => c.recalc( 'never', c.player.persuade(50) ),
		haveGold:		c => c.player.gold >= 500,
		killedGuard:	c => c.quest.riftenGate.killedGuard,
		scamTime:		c => c.time >= 8 && c.time <= 12+8,
		stoleRing:		[{ query: 'player', has: 'ring' }],
		plantedRing:	[{ query: 'brandShei', has: 'ring' }],
		atStallDaytime:	[
			{ query: 'scamTime' },
			{ query: 'brynjolf', isAt: 'bStall' },
			{ query: 'player', isAt: 'bStall' },
		],
	},
	stateHash: {
		BEGIN: [
			{ onTick: 'brynjolf', do: [
				{ await: 'atStallDaytime' },
				{ change: 'brynjolf', talkTo: 'player' }
			]},
			{ onEscape: 'brynjolf', do: [
				{ me: "I can take a hint. You want to make some coin, come find me." },
				{ exit: 'getInstructions' },
			]},
			{ onTalk: 'brynjolf', do: [
				{ if: 'haveGold', do: [
					{ me: "Never done an honest day's work in your life for all that coin you carry..." },
				],
				else: [
					{ me: "Running a little light in the pockets, lad?" }
				]},
				{ journal: 'miscellaneous', start: 'listenBrynjolf', mark: 'brynjolf' },
				{ pl: "I'm sorry, what?", top: 1, do: [
					{ me: "I'm saying you've got the coin, but you didn't earn a Septim of it honestly. I can tell." },
					{ deadend: 1 },
				]},
				{ choice: "How could you possibly know that?", do: [
					{ me: "Look how you sniffed out my little scheme at the North Gate. You knew it was a shakedown and you called him on it. That's what I'm talking about." },
					{ pl: "So the guard at the North Gate was your man?" },
					{ me: "Aye, that he was..." },
					{ if: 'killedGuard', do: [
						{ me: "Killing him was impulsive, but I'll let it go." },
					],
					else: [
						{ me: "I admire how you handled that." }
					]},
					{ pl: "You seem to be well acquainted with wealth." },
					{ me: "Wealth is my business. Help me out and I can add to yours. Would you like a taste?" }
				]},
				{ choice: "My wealth is none of your business.", do: [
					{ me: "Oh, but that's where your wrong lad. Wealth is my business. Maybe you'd like a taste?" },
				]},
				{ ask: 1 },
				{ pl: "What do you have in mind?" },
				{ me: "A bit of an errand. Need extra hands." },
				{ goto: 'getInstructions' }
			]}
		],
		getInstructions: [
			{ onResume: 'brynjolf', do: [
				{ me: "Glad to see you came to your senses." },
			]},
			{ onTalk: 'brynjolf', do: [
				{ choice: "What do I have to do?", do: [
					{ me: "Simple... I'm going to cause... Steal Madesi's ring and plant it on Brand-Shei." },
				]},
				{ choice: "No, nevermind.", do: [
					{ me: "You're trying my patience." },
					{ exit: 0 }
				]},
				{ ask: 1 },
				{ choice: "Why plant the ring on Brand-Shei?", do: [
					{ me: "There's someone that want to see him put out of business permanently. That's all you need to know." },
					{ if: 'scamTime', do: [
						{ me: "Now, you tell me when you're ready and we'll get started." },
					],
					else: [
						{ me: "I'll be out in the market all day. Meet me then if you've still got the stomach for it." },
					]},
				]},
				{ choice: "Break the law? Are you kidding?", do: [
					{ me: "Sorry... I usually have a nose for this kind of thing. Never mind then, lad. If you change your mind, come find me." },
					{ exit: 0 }
				]},
				{ ask: 1 },
				{ exit: 'getStarted' },
			]},
		],
		getStarted: [
			{ journal: 'miscellaneous', done: 'listenBrynjolf' },
			{ journal: 'aChanceArrangement', start: 'meet', mark: 'brynjolf' },
			{ onTick: 'brynjolf', do: [
				{ when: 'scamTime' },
				{ change: 'brynjolf', travelTo: 'bStall' },
			]},
			{ onTick: 'brynjolf', do: [
				{ await: 'atStallDaytime' },
				{ pick: [
					{ me: "I'm ready when you are. Just give the word." },
					{ me: "OK. Ready to make some coin?" }
				]},
				{ change: 'brynjolf', talkTo: 'player' }
			]},
			{ run: 'explain', from: 'shared' }
		],
		shared: [
			{ label: 'explain', onTalk: 'brynjolf', do: [
				{ if: { query: 'self', state: 'getStarted' },
					choice: "I'm ready. Let's get this started.", do: [
					{ me: "Good. Wait until I start the distraction, etc..." },
					{ exit: 'stealRing' }
				]},
				{ choice: "Why are we doing this to Brand-Shei?", do: [
					{ me: "We've been contracted..." },
					{ deadEnd: 1 }
				]},
				{ choice: "How am I supposed to do all of this?", do: [
					{ me: "Do you want me to hold... blah blah" },
					{ deadEnd: 1 }
				]},
				{ ask: 1 }
			]},
			{ label: 'speechify', onTick: 'brynjolf', do: [
				{ mode: 'bark' },
				{ me: 'Gather round everyone.' },
				{ me: 'etc etc. some of you will doubt...' },
				{ madesi: 'Is this another scam like last time?' }
			]}
		],
		stealRing: [
			{ run: 'explain', from: 'shared' },
			{ run: 'speechify', from: 'shared' },
			{ journal: 'aChanceArrangement', done: 'meet', start: 'steal', mark: 'ring' },
			{ onTick: 'player', do: [
				{ await: 'stoleRing' },
				{ goto: 'plantRing' }
			]}
		],
		plantRing: [
			{ run: 'explain', from: 'shared' },
			{ run: 'speechify', from: 'shared' },
			{ journal: 'aChanceArrangement', done: 'steal', start: 'plant', mark: 'brandShei' },
			{ onTick: 'player', do: [
				{ await: 'planted' },
				{ goto: 'speakBrynjolf' }
			]}
		],
		speakBrynjolf: [
			{ journal: 'aChanceArrangement', done: 'plant', start: 'speak', mark: 'brynjolf' },
			{ onTalk: 'brynjolf', do: [
				{ journal: 'aChanceArrangement', done: 'speak', complete: true },
				{ me: "My organization's been having a run of bad luck... There's more if you think you can handle it." },
			]}
		]
	}
};


let Script = {};

Script.Result = {
	ADVANCE: 1,
	AWAIT_REPLY: 2,
	AWAIT_CONDITION: 4,
	END: 8,
};

Script.Command = new function() {
	this.typeDetails = {
		isDefinition:   { is: 'DEF',   checker: 'command' },
		isStateHash:    { is: 'STATE', checker: 'hash', memberType: ['isStateDef'] },
		isCastHash:     { is: 'CAST',  checker: 'hash', memberType: ['isCastDef'] },
		isFlagHash:     { is: 'CAST',  checker: 'hash', memberType: ['isConditional','isFunction'] },
		isCommandArray: { is: 'CMD',   checker: 'commandList' },
		isConditional:  { is: 'CONDITIONAL', checker: 'commandList' },
		isPick:         { is: 'PICK',  checker: 'commandList' },
	}

	this.specHash = {
		stateHash: {
			allow: ['DEF'],
			param: {
				id:			['isString'],
				mayGive:	['isString','isFunction'],
				cast:		['isCastHash','undefined'],
				flag:		['isFlagHash','undefined'],
				priority:	['isPriority','undefined'],
				stateHash:	['isStateHash'],
			}
		},
		cast: {
			allow: ['DEF'],
			arbitraryKeys: true,
			cmdId: 'cmdCast'
		},
		flag: {
			allow: ['DEF'],
			arbitraryKeys: true,
			cmdId: 'cmdFlag'
		},
		priority: {
			allow: ['DEF', 'CMD'],
			param: {
				priority:	['isPriority'],
			},
			cmdId: 'cmdPriority'
		},
		onTick: {
			allow: ['STATE'],
			param: {
				onTick:		['isCastId'],
				label:		['isLabel','undefined'],
				do:			['isCommandArray'],
			},
			cmdId:		'cmdOnTick',
		},
		onTalk: {
			allow: ['STATE'],
			param: {
				onTalk:		['isCastId'],
				label:		['isLabel','undefined'],
				do:			['isCommandArray'],
			},
			cmdId:		'cmdOnTalk',
		},
		onEscape: {
			allow: ['STATE'],
			param: {
				onEscape:	['isCastId'],
				label:		['isLabel','undefined'],
				do:			['isCommandArray'],
			},
			cmdId:		'cmdOnEscape',
		},
		onResume: {
			allow: ['STATE'],
			param: {
				onTick:		['isCastId'],
				label:		['isLabel','undefined'],
				do:			['isCommandArray'],
			},
			cmdId:		'cmdOnResume',
		},
		journal: {
			allow: ['STATE','CMD'],
			param: {
				journal:	['isJournalEntry'],
				done: 		['isJournalStage','undefined'],
				start:		['isJournalStage','undefined'],
				mark:		['isEntityId','undefined'],
				complete:	['isBoolean','undefined'],
				fail:		['isBoolean','undefined'],
			},
			cmdId: 		'cmdJournal',
		},
		pl: {
			allow: ['CMD'],
			param: {
				pl:			['isDialog'],
			},
			cmdId:		'cmdPl',
		},
		me: {
			allow: ['CMD','PICK'],
			param: {
				me:			['isDialog'],
			},
			cmdId:		'cmdMe',
		},
		if: {
			allow: ['STATE','CMD'],
			param: {
				if:			['isConditional','isFlagId'],
				do:			['isCommandArray'],
				else:		['isCommandArray','undefined'],
			},
			cmdId:		'cmdIf',
		},
		choice: {
			allow: ['CMD'],
			param: {
				choice:		['isDialog'],
				do:			['isCommandArray'],
			},
			cmdId:		'cmdChoice',
		},
		ask: {
			allow: ['CMD'],
			param: {
				ask:		['isDummy'],
			},
			cmdId:		'cmdAsk',
		},
		pick: {
			allow: ['CMD','PICK'],
			param: {
				pick:		['isPickArray'],
			},
			cmdId:		'cmdPick',
		},
		change: {
			allow: ['STATE','CMD','CONDITIONAL'],
			param: {
				change:		['isEntityId'],
				gold:		['isNumber','undefined'],
				give:		['isCastId','undefined'],
				travelTo:	['isEntityId','undefined'],
				talkTo:		['isEntityId','undefined'],
			},
			cmdId:		'cmdChange',
		},
		await: {
			allow: ['CMD'],
			param: {
				await:		['isConditional','isFlagId'],
			},
			cmdId:		'cmdAwait',
		},
		goto: {
			allow: ['CMD'],
			param: {
				goto:		['isStateId'],
			},
			cmdId:		'cmdGoto',
		},
		exit: {
			allow: ['CMD'],
			param: {
				exit:		['isStateId','isNumber'],
			},
			cmdId:		'cmdExit',
		},
		run: {
			allow: ['CMD'],
			param: {
				run:		['isLabelId'],
			},
			cmdId:		'cmdRun',
		},
		query: {
			allow: ['CONDITIONAL'],
			param: {
				query:		['isCastId','isFlagId'],
				isAt:		['isCastId','undefined'],
				has:		['isCastId','undefined'],
				hasState:	['isString','undefined']
			},
			cmdId:		'cmdQuery',
		}
	};
	Object.assignIds(this.specHash);

	this.findSpec = (cmd) => {
		for( let commandId in this.specHash ) {
			if( cmd[commandId] ) {
				return this.specHash[commandId];
			}
		}
		return null;
	}

	return this;
}

Script.Validator = class {
	constructor(world) {
		this.world = world;
		this.reset();
	}
	reset() {
		this.cast = null;
		this.flag = null;
		this.code = null;
		this.ip = null;

		this.error = null;
	}
	assert(value,text) {
		if( !value ) {
			throw text+' in '+this.trail.join('.');
		}
		return true;
	}
	test(value,text) {
		if( !value ) {
			this.error = this.error || text+' in '+this.trail.join('.');
			return false;
		}
		return true;
	}
	validateType(value,typeId,trail) {
		switch( typeId ) {
			case 'undefined':
				return this.test( value===undefined, 'must be undefined' );
			case 'isStateHash':
				return this.test( Object.isObject(value), 'stateHash must contain objects' );
			case 'isCastHash':
				return this.test( Object.isObject(value), 'cast "'+trail+'" must be a hash' );
			case 'isFlagHash':
				return this.test( Object.isObject(value), 'flag "'+trail+'" must be a hash' );
			case 'isStateDef':
				return this.test( Array.isArray(value), 'state def "'+trail+'" must be a command list' );
			case 'isCastDef':
				return this.test( value===null || this.world.find(value), 'cast def "'+trail+':'+value+'" must be an entity id' );
			case 'isCastId':
				return this.test( this.cast[value] !== undefined, 'cast "'+value+'" not found' );
			case 'isFlagId':
				return this.test( this.flag[value] !== undefined, 'flag "'+value+'" not found' );
			case 'isEntityId':
				return this.test( this.world.find(value), 'entity "'+value+'" not found' );
			case 'isState':
				return this.test( this.statesHash[value] === undefined, 'state "'+value+'" not found' );
			case 'isLabel':
				let found = false;
				for( let stateId in this.stateHash ) {
					found = found || this.stateHash[stateId].label === value;
				}
				return this.test( found, 'label reference bad'+value );
			case 'isPriority':
				let priorityValues = { normal: 1, quest: 2 };
				return this.test( priorityValues[value] !== undefined, 'bad priority '+value );
			case 'isCommandArray':
				return this.test( Array.isArray(value), 'command block must be array' );
			case 'isJournalEntry':
				this.journalId = value;
				return this.test( Journal.Data[value] !== undefined );
			case 'isJournalStage':
				return this.test( Journal.Data[this.journalId][value] !== undefined );
			case 'isBoolean':
				return this.test( value===true || value===false );
			case 'isNumber':
				return this.test( Number.isFinite(value) );
			case 'isFunction':
				return this.test( typeof value === 'function' );
			case 'isString':
				return this.test( typeof value === 'string' );
			case 'isDialog':
				return this.test( typeof value === 'string' );
			case 'isConditional':
				return this.test( Array.isArray(value) );
		}
		// Type not found.
		debugger;
	}
	validateParam( typeList, key, value, addMoreFn) {
		let ok = false;
		typeList.forEach( typeId => {
			let isValid = this.validateType( value, typeId, key );
			ok = ok || isValid;
			if( isValid ) {
				addMoreFn(typeId);
			}
		});
		return ok;
	}
	validateCommand(allowId,cmd) {
		this.assert( Object.isObject(cmd), 'All commands must be objects.' );
		let spec = Script.Command.findSpec(cmd);
		this.assert( spec, 'Unknown command '+JSON.stringify(cmd) );
		this.assert( spec.allow.includes(allowId), 'Keyword '+spec.id+' not allowed in '+allowId );

		for( let paramId in cmd ) {
			this.assert( spec.param[paramId], "Command "+spec.id+" does not support key "+paramId );
		}

		this.validateHash( allowId, spec.param, paramId=>cmd[paramId], paramId=>spec.param[paramId] );
	}
	validateHash(allowId,hash,valueFn,typeListFn) {
		let more = [];
		for( let key in hash ) {
			let value    = valueFn(key);
			let typeList = typeListFn(key);
			this.error   = null;
			let ok = this.validateParam( typeList, key, value, typeId=>{
				if( Script.Command.typeDetails[typeId] ) {
					more.push( typeId, value, key );
				}
			});
			if( !ok ) {
				this.assert( false, this.error );
			}
		}
		this.validateCode(more);
	}
	validateCommandList(allowId,cmdList) {
		for( let ip=0 ; ip<cmdList.length ; ++ip ) {
			let cmd = cmdList[ip];
			this.validateCommand( allowId, cmd );
		}
	}
	validateCode(more) {
		while( more.length ) {
			let codeType = Script.Command.typeDetails[more.shift()];
			let value    = more.shift();
			let trail    = more.shift();

			this.trail.push( trail );

			if( codeType.checker == 'command' ) {
				this.validateCommand( codeType.is, value );
			}
			if( codeType.checker == 'hash' ) {
				this.validateHash( codeType.is, value, key=>value[key], key=>codeType.memberType );
			}
			if( codeType.checker == 'commandList' ) {
				this.validateCommandList( codeType.is, value );
			}
			this.trail.pop( trail );
		}
	}
	validate(definition) {
		this.definition = definition;
		this.cast = definition.cast || {};
		this.flag = definition.flag || {};
		this.stateHash = definition.stateHash || {};
		this.ip = [0];
		this.trail = [];
		this.error = null;

		this.validateCode([
			'isDefinition',
			definition,
			definition.id
		]);
	}
}

Script.Definition = class {
	constructor(data) {
		console.assert( data.id );
		Object.assign( this, data );
	}
}

Script.Process = class {
	constructor( callerId, entry, stateId, eventId, entityId, labelId, lines ) {
		this.id       = Date.makeUid();
		this.callerId = callerId;
		this.entry    = entry;
		this.eventId  = eventId;
		this.entityId = entityId;
		this.labelId  = labelId;
		this.lines    = lines;
		this.stateId  = stateId;
		this.ip       = 0;
		this.active   = false;
		this.context  = { process: this, cmd: null };
	}
	get observer() {
		return this.entry.manager.observer;
	}
	get dialog() {
		return this.observer.dialog;
	}
	get manager() {
		return this.entry.manager;
	}
	activate(state=true) {
		this.active = state;
	}
	addProcessHelper(eventId,param) {
		let process = new Script.Process(
			this.id,
			this.entry,
			this.stateId,
			eventId,
			param[eventId],
			param.label,
			param['do']
		);
		this.entry.manager.addProcess(process);
		return Script.Result.ADVANCE;
	}
	cmdOnTick(context,param) {
		return this.addProcessHelper('onTick',param);
	}
	cmdOnTalk(context,param) {
		return this.addProcessHelper('onTalk',param);
	}
	cmdOnEscape(context,param) {
		return this.addProcessHelper('onEscape',param);
	}
	cmdOnResume(context,param) {
		return this.addProcessHelper('onResume',param);
	}
	cmdJournal(context,param) {
		let journal = this.observer.journal;
		let journalId = param.journal;
		console.assert( Journal.Data[journalId] );
		let journalTitle = String.unCamel( journalId );

		journal.add( journalId, journalTitle );

		if( param.done !== undefined ) {
			journal.stageSetDone( journalId, param.done, JournalData[journalId][param.done] );
		}
		if( param.start !== undefined ) {
			journal.stageAdd( journalId, param.start, JournalData[journalId][param.start] );
		}
		if( param.mark !== undefined ) {
			journal.mark( journalId, param.mark );
		}
		if( param.complete ) {
			journal.setComplete( journalId );
		}
		if( param.fail ) {
			journal.setFailed( journalId );
		}
		return Script.Result.ADVANCE;
	}
	cmdPl(context,param) {
		this.observer.dialog.addReply( this.id, this.pl );
		return Script.Result.ADVANCE | Script.Result.AWAIT_REPLY;
	}
	cmdMe(context,param) {
		console.assert( !this.dialog.hasSay );
		this.observer.dialog.addSay( this.id, this.me );
		return Script.Result.ADVANCE;
	}
	cmdChoice(context,param) {
		this.observer.dialog.addReply( this.id, this.pl, this['do'] );
		return Script.Result.ADVANCE;
	}
	cmdAsk(context,param) {
		return Script.Result.ADVANCE | Script.Result.AWAIT_REPLY;
	}


/*
	- if: any conditional... do: ... else: ...
	- choice: n adds a choice to the speech's list of player choices. can combine with "if"
	- ask: n stops adding choices and pauses execution until a choice is made
	- pick: choose one option for an array
	- change(anyId) - pick as target and does an operation upon them
		- ops are gold/amount, give/itemId, travelTo/siteId, talkTo/whom etc.
	- await: [ list of conditionals ] all must be true to continue execution
	  we can even check whether, for example, a character is actually heading for a location...
	- goto 'state'. Clears the EVENT array for current state. (must always end a sequence)
	- exit 'state'  Just like goto, except the leaves the dialog
	- run 'label'. Runs the label named.
*/
	execute() {
		this.context.cmd = this.lines[this.ip];
		let spec = Script.Command.findSpec( context.cmd );
		console.assert(spec);
		let commandId   = spec.cmdId;
		let result = this[commandId](context,this.context.cmd);
		return result;
	}
	executeAll() {
		while( this.ip < this.lines.length ) {
			this.execute();
			this.ip += 1;
		}
		this.complete();
	}
	executeUntilStop() {
		let result = Script.Result.ADVANCE;
		while( result & Script.Result.ADVANCE ) {
			result = execute();
		}
		if( result & Script.Result.END ) {
			this.complete();
		}
	}
	complete() {
	}
	tick() {
		if( this.eventId == 'onTick' ) {
			this.executeUntilStop();
		}
	}
}

Script.State = class {
	constructor(entry,stateId,labelId) {
		this.stateId  = stateId;
		this.labelId  = labelid;
		this.onEscape = null;
		this.onResume = null;
		this.onTalk   = {};
		this.onTick   = {};
	}
}

Script.Entry = class {
	constructor( manager, definition ) {
		this.id = definition.id;
		this.manager = manager;
		this.definition = definition;
		this.stateId = null;
		this.stateProcess = null;
	}
	get stateHash() {
		return this.definition.stateHash;
	}
	setState(context,newStateId) {
		if( this.stateId == newStateId ) {
			return true;
		}
		// At some point this needs to scan the process list and REMOVE all
		// processes that are not the incoming state.
		this.stateId = newStateId;
		let commandList = this.stateHash[this.stateId];
		console.assert( Array.isArray( commandList ) );
		context.stateId = this.stateId;

		this.stateProcess = new Script.Process( this.id, this, this.stateId, null, null, null, commandList );
		this.stateProcess.executeAll();
	}
}


Script.Manager = class {
	constructor(validator) {
		this.observer       = null;
		this.definitionList = [];
		this.entryList      = [];
		this.processList    = new ListManager([]);
		this.validator      = validator;
	}
	setObserver(observer) {
		this.observer = observer;
	}
	addDefinition( definitionRaw ) {
		let definition = new Script.Definition( definitionRaw );
		this.definitionList.push( definition );

		// For now we are just making static versions of everything, but
		// in future whenever mayGive applies to a person we should make
		// a Script.Entry for them.
		this.entryList.push( new Script.Entry( this, definition ) );
	}
	addProcess( process ) {
		this.processList.push( process );
	}
	scanEntries() {
		this.entryList.forEach( entry => {
			if( !entry.stateId ) {
				entry.setState( 'BEGIN' );
			}
		});
	}
	scanDefinitions(definitionHash) {
		Object.each( definitionHash, (definition) => {
			definition.cast = definition.cast || {};
			definition.flag = definition.flag || {};
			definition.cast.player = 'player';
		});
		Object.each( definitionHash, (definition) => {
			this.validator.validate(definition);
		});
		Object.each( definitionHash, (definition) => {
			this.addDefinition( definition );
		});
	}
	onTalk() {
		let inDialog = this.observer.dialog && this.observer.dialog.speaker.id==this.entityId;
		if( inDialog ) {
			this.processList.traverse( process => {
				process.tick(dt);
			});
		}
	}
	tick(dt) {
		this.processList.traverse( process => {
			process.tick(dt);
		});
	}
}

return {
	Quest: Quest,
	Script: Script
}

});
