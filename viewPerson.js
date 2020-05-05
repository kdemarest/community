Module.add( 'viewPerson', ()=>{

View.Person = class extends View.Showable {
	constructor(divId) {
		super(divId);
	}
	setVisible(value) {
		this.div.style.display = value ? 'block' : 'none';
	}
	message( msg, payload ) {
		super.message(...arguments);
		if( msg == 'showPerson' ) {
			let person = payload;
			let cap = String.capitalize;
			let [anchor,finish] = new Markup( this.div, person=>[
				{ on: 'click',		action: ()=>guiMessage('showPerson',person) },
				{ on: 'mouseover',	action: ()=>guiMessage('hoverPerson',person.isAlive?person:null) },
				{ on: 'mouseout',	action: ()=>guiMessage('hoverPerson',null) }
			]).convenient();
			let s = '<div style="color:green;"><b>'+cap(person.nameFull)+', '+person.textSkillLevel+' '+person.textJob+'</b></div>';
			s += person.age+' year old '+person.textInformalGender+'<br/>';
			if( person.spouse ) {
				s += cap(person.textMarriageRole)+' of '+anchor(person.spouse,person.spouse.nameFull)+'<br/>';
			}
			let childList = person.childList.sort( (a,b) => Math.sign( b.respect-a.respect ) );
			childList.forEach( child => {
				s += (child.isTwin?'Twin ':'')+anchor(child,child.nameFirst)+', '+child.titleChild+' age '+child.age+'<br/>';
			});
			if( person.mother && person.father ) {
				s += cap(person.titleChild)+' of '+anchor(person.mother,person.mother.nameFirst)+' and '+anchor(person.father,person.father.nameFirst)+' '+person.father.surname+'<br/>';
				if( person.mother.isDead && person.father.isDead ) {
					s += "Both deceased.<br/>";
				}
				else if( person.mother.isDead ) {
					s+='Mother deceased.<br/>';
				}
				else if( person.father.isDead ) {
					s+='Father deceased.<br/>';
				}
			}
			finish(s);
			guiMessage( 'viewShow', this.divId );
			if( person.isAlive ) {
				guiMessage( 'cityFocus', person );
			}
		}
	}
}

});