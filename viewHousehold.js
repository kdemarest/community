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
			let s = '<div><b>The '+household.textTitle+' Home</b></div>';
			let m = household.memberList.slice();
			m.sort( (a,b) => Math.sign( b.respect-a.respect ) );
			let headSurname = household.head.nameLast;
			s += m.map( p => String.capitalize(p.textFamilyRole+' '+p.nameFirst+(p.nameLast!=headSurname?' '+p.nameLast:'')+' '+p.textGenderAge+' '+p.textJobSummary) ).join('<br>');

			this.div.innerHTML = s;
			guiMessage( 'viewShow', this.divId );
		}
	}
}

});
