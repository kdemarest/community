Module.add( 'viewDialog', ()=>{

View.Dialog = class extends View.Showable {
	constructor(divId) {
		super(divId);
		this.person = null;
		this.dialog = null;
		this.replyCount = 0;
	}
	setVisible(value) {
		this.div.style.display = value ? 'block' : 'none';
	}
	dialogOpen(person) {
		this.person = person;
		this.dialog = new Dialog.Manager(this.observer,person);

		this.div.off('.viewDialog');
		this.div.on('click','.viewDialog',()=>{
			if( this.replyCount <= 0 ) {
				this.dialogClose();
			}
		});
		//document.off('.viewDialog');
		Gui.keyHandler.add( '.viewDialog', (event)=>{
			if( event.key == 'Escape' ) {
				this.dialogClose();
			}
		});
	}
	dialogClose() {
		this.dialog = null;
		this.setVisible(false);
	}
	draw() {
		let person = this.person;
		let cap = String.capitalize;

		let [anchor,finish] = new Markup( this.div, reply=>[
			{ on: 'click',		action: (event) => {
				this.dialog.select(reply);
				this.draw();
				event.stopPropagation();
			}},
		]).convenient();

		let speech = this.dialog.speech;

		let s = '';
		s += '<table>';
		s += '<tr>';
		s += '<th><img src="icons/children.png"></th>';
		s += '<th class="name"><h1>'+cap(person.text.nameFull)+'</h1><p>'+speech.say+'</p></th>';
		s += '</tr>';
		s += '<tr>';
		s += '<td><h1>Topics</h1></td>';
		s += '<td>';
		s += '<ul>';
		this.replyCount = 0;
		speech.replyList.forEach( reply => {
			if( !reply.text ) {
				return;
			}
			s += '<li'+(reply.said?' class="said"':'')+'>'+anchor(reply,reply.text)+'</li>';
			this.replyCount++;
		});
		s += '</ul>';
		s += '</td></tr></table>';
		finish(s);
	}
	message( msg, payload ) {
		super.message(...arguments);
		if( msg == 'talkPerson' ) {
			let person = payload;
			this.dialogOpen(person);
			this.setVisible(true);
			this.draw();
			if( person.isAlive ) {
				guiMessage( 'cityFocus', person );
			}
		}
		if( msg == 'untalkPerson' ) {
			this.dialogClose();
		}
	}
}

});