Module.add( 'viewJournal', ()=>{

View.Journal = class extends View.Showable {
	constructor(divId) {
		super(divId);
	}
	setVisible(value) {
		this.div.style.display = value ? 'block' : 'none';
	}
	message( msg, payload ) {
		super.message(...arguments);
		if( msg == 'showJournal' ) {
			let journal = observer.journal;
			let [anchor,finish] = new Markup( this.div, entry=>[
				{ on: 'click', action: ()=>guiMessage('showMark',entry) }
			]).convenient();
		
			let s = '<div><b>Journal</b></div>';
			journal.traverse( entry => {
				s += (entry.status||'open')+' '+anchor(entry.text)+'<br/>';
				Object.each( entry.stageHash, stage => {
					s += (stage.done ? '# ' : '')+stage.text+'<br/>';
				});
			});
			finish(s);
			guiMessage( 'viewShow', this.divId );
		}
	}
}

});
