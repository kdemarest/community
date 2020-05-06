Module.add( 'journal', ()=>{

class Journal extends HashManager {
	constructor() {
		super();
	}
	add(id,text) {
		let entry = this.get(id) || super.add(id,{
			text: text,
			status: '',
			mark: null,
			stageHash: {}
		});
	}
	stageAdd(id,stageId,text) {
		let stageHash = this.get(id).stageHash;
		if( stageHash[stageId] ) {
			return;
		}
		stageHash[stageId] = {
			text: text,
			done: false
		}
		return stageHash[stageId];
	}
	stageExists(id,stageId) {
		return this.get(id) && this.get(id).stageHash[stageId]
	}
	stageSetDone(id,stageId,isDone) {
		let stageHash = this.get(id).stageHash;
		if( stageHash ) {
			stageHash[stageId].done = isDone;
		}
	}
	mark(id,thing) {
		this.get(id).mark = thing;
	}
	setStatus(id,status) {
		console.assert( !this.get(id).status );
		this.get(id).status = status;
	}
	fail(id) {
		this.setStatus(id,'failed');
	}
	complete(id) {
		this.setStatus(id,'complete');
	}
	isComplete(id) {
		return this.get(id) && this.get(id).status == 'complete';
	}
}

return {
	Journal: Journal
}

});