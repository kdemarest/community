Module.add('dialog',()=>{

//
// Speakers must have the following members:
// - dialogMemory - a has to contain everything they've spoken about
// - id - to uniquely identify them

let Dialog = {};

Dialog.Manager = class {
	constructor(observer,speaker) {
		this.observer  = observer;
		this.speaker   = speaker;
		this.questHash = speaker.questHashFn();
		this.questId   = null;
	}
	get speech() {
		let speech = {
			say: null,
			replyList: [],
			topicList: [],
		};

		speech.say = this.lastSay || '';

		if( !this.questId ) {
			Object.each( this.questHash, (quest,questId) => {
				quest.getDialogEntries( this.observer, this.speaker, reply => {
					speech.replyList.push( reply );
				});
			});
		}

		return speech;
	}
	select(reply) {
		reply.quest.select(reply);
		this.lastSay = reply.say || this.lastSay;
	}
};


Quest.Data.aboutMe = {
	appliesTo: person=>true,
	stateId: 'main',
	stateHash: {
		main: {
			giver: [
				{	Q: 'What is your name?',
					A: c=>`My name is ${c.me.nameFull}.`
				},
				{	Q: 'How old are you?',
					A: c=>`I am ${c.me.age} years old.`
				},
				{	Q: 'What do you do for a living?',
					A: c=>`Since I was young I trained as a ${c.me.textJob}.`,
					onQ: 'job'
				}
			]
		},
		job: {
			giver: [
				{	Q: 'Are you good at it?',
					A: c=>`Some call me ${c.me.textSkillLevel} at what I do.`
				},
				{	Q: 'Do you enjoy the work?',
					A: 'It is all I have ever known.'
				},
				{	Q: me=>'How long have you been a '+me.textJob+'?',
					A: me=>`Ever since I was ${me.textBoyGirl}`
				},
				{	Q: me=>'Lets talk about something else.',
					onQ: 'giver'
				}
			]
		}
	}
}

/*
ThreadType.gameGreeter = {
	appliesTo: person=>true,
	phraseHash: {
		top: {
			player: 'c1/To dust we ever shall return. Even the mighty may not withstand time.',
		},
		c1: {
			say: 'But upon what authority comes this information to you, for I have seen much.',
			player: 'Only gods live forever.'
		},
		c2: {
			say: 'No, for what is life but the use of energy. There is more than enough to power our slight frames, even to the end of all things. If only one had the will, and the means.',
			player: 'Do not envy what only gods possess, for that way lies cataclysm.',
		},
		c3: {
			say: 'But I do envy it. I do.'
		}
	}
}

ThreadType.dwarvenKnowledge = {
	topic: 'dwarves',
	appliesTo: person=>person.isDwarf,
	phraseHash: {
		top: {
			say: 'What would you like to know about dwarves?',
			player: [
				'whyUnder/Why do you live under ground?',
				'insult/I heard dwarven women have beards.'
			]
		},
		whyUnder: {
			say: 'All the better to be close to the gems. Glorious gems!',
		},
		insult: {
			say: 'That is outrageous!',
			fnOnce: context => context.player.affinity.dwarves--
		}
	}
}
*/

return {
	Dialog: Dialog
}

});
