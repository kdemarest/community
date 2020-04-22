Module.add('dataAspect',function() {

let AspectTypeHash = {
	food: {
		period: 14,
		percentOfPopulation: 0.20,
		placeInitHash: {
			farm: {
				workforceRatio: 0.50,
				workforceMax: 50,
//				domicile: { farmhouse: 9 },		// 9 tiles per inhabitant; if domicile not specified, it is just a house:9
//				workplace: { field: 15 },		// if not specified, it is the same as the placename
				jobInitHash: {
					farmer: { onePerWorkplace: true, useIfSingular: true, mustPickFirst: true },
					farmHand: {},
				}
			},
			pasture: {
				workforceMax: 20,
				jobInitHash: {
					shepherd: {},
					cowboy: {}
				}
			},
			foodCaravan: {
				isTradeRoute: true,
				workforceMax: 20,
				jobInitHash: {
					foodTrader: {},
				}
			},
			garden: {
				neverPickFirst: true,
				workforceMax: 5,
				jobInitHash: {
					botanist: { },
				}
			},
			grocery: {
				neverPickFirst: true,
				workforceMax: 10,
				jobInitHash: {
					grocer: { }
				}
			}
		}
	},
	shelter: {	// Includes construction of all food storage, cisterns, etc.
		period: 30,
		percentOfPopulation: 0.05,
		placeInitHash: {
			builder: {
				workforceMax: 15,
				jobInitHash: {
					mason: {},
					carpenter: {}
				}
			}
		}
	},
	security: {
		period: 7,
		percentOfPopulation: 1/7,
		placeInitHash: {
			barracks: {
				jobInitHash: {
					captain: { onePerWorkplace: true },
					guard: { useIfSingular: true },
				}
			},
			training: {
				jobInitHash: {
					guard: {}
				}
			}
		}
	},
	entertainment: {
		period: 10,
		percentOfPopulation: 0.10,
		placeInitHash: {
			studio: {
				workforceMax: 3,
				jobInitHash: {
					artist: {}
				}
			},
			tavern: {
				workforceMax: 12,
				jobInitHash: {
					bartender: { mustPickFirst: true, onePerWorkplace: true },
					bard: { onePerWorkplace: true },
					server: {}
				}
			},
			theater: {
				workforceMax: 8,
				jobInitHash: {
					director: { onePerWorkplace: true },
					actor: { useIfSingular: true }
				}
			}
		}
	},
	leadership: {
		period: 1,
		percentOfPopulation: 0.10,
		placeInitHash: {
			palace: {
				onePerCommunity: true,
				alwaysMaxWorkforce: true,
				jobInitHash: {
					ruler: { onePerWorkplace: true, mustPickFirst: true },
					planner: { onePerWorkplace: true },
					functionary: {},
				}
			},
			estate: {
				workforceMax: 12,
				jobInitHash: {
					noble: { onePerWorkplace: true, mustPickFirst: true },
					lackey: {}
				}
			}
		}
	},
	goods: {
		period: 1,
		percentOfPopulation: 1/3.5,		// ~0.28
		placeInitHash: {
			caravan: {
				isTradeRoute: true,
				chance: 5,
				workforceRatio: 0.20,	// double the usual
				workforceMax: 6,
				jobInitHash: {
					trader: {}
				}
			},
			peddlerWagon: {					// basically an itinerant trader
				workforceRatio: 0.001,
				workforceMax: 2,
				jobInitHash: {
					peddler: {}
				}
			},
			bloomery: {
				workforceMax: 12,
				jobInitHash: {
					smelterForeman: { onePerWorkplace: true },
					smelter: { useIfSingular: true }
				}
			},
			brewery: {
				workforceMax: 12,
				jobInitHash: {
					brewer: {},
				}
			},
			clothier: {
				workforceMax: 4,
				jobInitHash: {
					tailor: {},
					clothier: {},
					haberdasher: {},
					cobbler: {},
				}
			},
			armory: {
				workforceMax: 8,
				jobInitHash: {
					armorer: { mustPickFirst: true },
					gaunter: {}
				}
			},
			bowyery: {
				workforceMax: 6,
				jobInitHash: {
					bowyer: { mustPickFirst: true },
					fletcher: {}
				}
			},
			jeweler: {
				workforceMax: 4,
				jobInitHash: {
					jeweler: { mustPickFirst: true },
					lapidary: {}
				}
			},
			glassBlower: {
				workforceMax: 8,
				jobInitHash: {
					glassBlower: {}
				}
			},
			mine: {
				workforceMax: 40,
				jobInitHash: {
					mineForeman: { mustPickFirst: true, onePerWorkplace: true },
					miner: { useIfSingular: true }
				}
			},
			smithy: {
				workforceMax: 6,
				jobInitHash: {
					blacksmith: { mustPickFirst: true },
					smithApprentice: {}
				}
			}
		}
	},
	wisdom: {
		period: 7,
		percentOfPopulation: 0.05,
		placeInitHash: {
			library: {
				workforceMax: 20,
				jobInitHash: {
					librarian: {}
				}
			},
			school: {
				workforceMax: 20,
				jobInitHash: {
					teacher: { useIfSingular: true },
					principle: {}
				}
			},
			temple: {
				workforceMax: 12,
				jobInitHash: {
					priest: { mustPickFirst: true },
					acolyte: {}
				}
			},
			hospital: {
				workforceMax: 20,
				jobInitHash: {
					doctor: { mustPickFirst: true },
					nurse: {}
				}
			},
			scriptorium: {
				workforceMax: 8,
				jobInitHash: {
					scribe: {}
				}
			}
		}
	},
	indigent: {
		isHidden: true,
		period: 0,
		percentOfPopulation: 0.20,
		placeInitHash: {
			family: {
				chance: 0.90,
				jobInitHash: {
					child: { isChild: true }
				}
			},
			around: {
				chance: 0.10,
				jobInitHash: {
					bum: { }
				}
			}
		}
	}
};
/**
	AspectType
	percentOfPopulation	- how much of the pop will do this job
	popServedPerWorker	- how many people will be served by one worker of normal skill at this job
	placeTypeHash {}	- all the places that produce this aspect
	jobTypeHash {}		- what job types produce this aspect
*/

/**
	JobType
	-------
	id					- unique jobTypeId
	name				- name of this job type
	workplaceType		- placeType that this job works at
	produces			- what this job produces
	peopleServed		- the number of people a single worker at this job can serve with nominal skill
	mustPickFirst
	useIfSingular
	onePerWorkplace
*/
let JobTypeHash = {
};

/**
	PlaceType
	---------
	id					- unique placeTypeId
	name				- what this place is called
	jobTypeHash			- what jobs work at this place
	workerCapacity		- (Place) how many workers this place has utilize
	workers {}			- (Place) who my workers actually are
*/

let PlaceTypeHash = {
};


Object.each( AspectTypeHash, (aspectType,aspectTypeId) => {
	aspectType.id				= aspectTypeId;
	aspectType.placeTypeHash	= {};
	aspectType.jobTypeHash		= {};

	// Normally each place can consume an equal number of workers.
	aspectType.workforceRatio = 1/Object.count(aspectType.placeInitHash);
	//console.log(aspectTypeId,aspectType.workforceRatio);

	// Initialize global hashes, and also my local hashes.
	Object.each( aspectType.placeInitHash, (placeInit,placeTypeId) => {
		PlaceTypeHash[placeTypeId] = PlaceTypeHash[placeTypeId] || {};
		aspectType.placeTypeHash[placeTypeId] = PlaceTypeHash[placeTypeId];
		Object.each( placeInit.jobInitHash, (jobInit,jobTypeId) => {
			JobTypeHash[jobTypeId] = JobTypeHash[jobTypeId] || {};
			aspectType.jobTypeHash[jobTypeId] = JobTypeHash[jobTypeId];
		});
	});

	// Fill in the members of each.
	Object.each( aspectType.placeInitHash, (placeInit,placeTypeId) => {

		// Assign the PlaceType
		Object.assign(
			PlaceTypeHash[placeTypeId],
			{
				id:					placeTypeId,
				//name:				placeTypeId,
				jobTypeHash:		Hash.map( placeInit.jobInitHash, (X,jobTypeId) => JobTypeHash[jobTypeId] ),
				produces:			aspectType
			},
			placeInit
		);

		// Assign the JobType
		Object.each( placeInit.jobInitHash, (jobInit,jobTypeId) => {
			Object.assign( 
				JobTypeHash[jobTypeId],
				{
					id:				jobTypeId,
					name:			jobTypeId,
					workplaceType:	PlaceTypeHash[placeTypeId],
					produces:		aspectType,
					peopleServed:	1 / aspectType.percentOfPopulation
				},
				jobInit
			);
		});
	});
});

return {
	AspectTypeHash: AspectTypeHash,
	JobTypeHash: JobTypeHash,
	PlaceTypeHash: PlaceTypeHash
}
});
