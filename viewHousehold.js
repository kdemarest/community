Module.add( 'viewHousehold', ()=>{

View.Household = class extends View.Showable {
	constructor(divId) {
		super(divId);
	}
	setVisible(value) {
		this.div.style.display = value ? 'block' : 'none';
	}
	message( msg, payload ) {
		super.message(...arguments);
		if( msg == 'showHousehold' ) {
			let household = payload;
			let cap = String.capitalize;
			let [anchor,finish] = new Markup( this.div, person=>[
				{ on: 'click',		action: ()=>guiMessage('showPerson',person) },
				{ on: 'mouseover',	action: ()=>guiMessage('hoverPerson',person.isAlive?person:null) },
				{ on: 'mouseout',	action: ()=>guiMessage('hoverPerson',null) }
			]).convenient();
		
			let s = '<div><b>The '+household.textTitle+' Home</b></div>';
			let m = household.memberList.slice();
			m.sort( (a,b) => Math.sign( b.respect-a.respect ) );
			let headSurname = household.head.nameLast;
			s += m.map( p => String.capitalize(p.textFamilyRole+' '+anchor(p,p.nameFirst+(p.nameLast!=headSurname?' '+p.nameLast:''))+' '+p.textGenderAge+' '+p.textJobSummary) ).join('<br>');

			finish(s);
			guiMessage( 'viewShow', this.divId );
		}
	}
}

});
