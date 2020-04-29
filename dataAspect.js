Module.add('dataAspect',function() {

let AspectTypeHash = {
	water: {
	},
	sleep: {
	},
	leisure: {
	},
	arms: {
	},
	food: {
		icon: 'food.png',
		percentOfPopulation: 0.20,
		venueInitHash: {
			farm: {
				icon: 'farm.png',
				workforceRatio: 0.50,
				workforceMax: 50,
//				domicile: { farmhouse: 9 },		// 9 tiles per inhabitant; if domicile not specified, it is just a house:9
//				venue: { field: 15 },		// if not specified, it is the same as the venuename
				jobInitHash: {
					farmer: { onePerVenue: true, useIfSingular: true, mustPickFirst: true, icon: { img: 'person.png', holding: 'farmer.png' } },
					farmHand: { icon: { img: 'person.png', holding: 'farmer.png' } },
				}
			},
			pasture: {
				icon: 'field.png',
				workforceMax: 20,
				jobInitHash: {
					shepherd: { icon: { img: 'person.png', holding: 'shepherd.png' } },
					cowboy: { icon: 'cowboy.png' }
				}
			},
			foodCaravan: {
				icon: 'muleFood.png',
				isTradeRoute: true,
				workforceMax: 20,
				jobInitHash: {
					foodTrader: { icon: { img: 'person.png', iconHolding: 'food.png' } },
				}
			},
			garden: {
				icon: 'garden.png',
				neverPickFirst: true,
				workforceMax: 5,
				jobInitHash: {
					botanist: { icon: { img: 'person.png', iconHolding: 'garden.png' } },
					beeKeeper: { icon: { img: 'person.png', iconHolding: 'beeKeeperHolding.png' } },
				}
			},
			grocery: {
				icon: 'grocery.png',
				neverPickFirst: true,
				workforceMax: 10,
				jobInitHash: {
					grocer: { icon: { img: 'person.png', iconHolding: 'grocery.png' } }
				}
			}
		}
	},
	venue: {	// Includes construction of all food storage, cisterns, etc.
		icon: 'venue.png',
		percentOfPopulation: 0.05,
		venueInitHash: {
			builder: {
				icon: 'builder.png',
				workforceMax: 15,
				jobInitHash: {
					mason: { icon: { img: 'person.png', holding: 'mason.png' } },
					carpenter: { icon: { img: 'person.png', holding: 'carpenter.png' } }
				}
			}
		}
	},
	security: {
		icon: 'security.png',
		percentOfPopulation: 0.10,
		venueInitHash: {
			barracks: {
				icon: 'barracks.png',
				venueAlso: 'trainingGrounds',
				jobInitHash: {
					captain: { onePerVenue: true, icon: { img: 'person.png', holding: 'captain.png' } },
					guard: { useIfSingular: true,  icon: { img: 'person.png', holding: 'guard.png' } },
					medic: { 
						chance: 0.10,	// About 10% of a battalion is medics.
						producesId: 'health',
						whole: true,
						well: false,
						icon: { img: 'person.png', holding: 'doctor.png' }
					},
				}
			}
		}
	},
	entertainment: {
		icon: 'entertainment.png',
		percentOfPopulation: 0.10,
		venueInitHash: {
			studio: {
				icon: 'artist.png',
				workforceMax: 3,
				jobInitHash: {
					artist: { icon: { img: 'person.png', overlay: 'artist.png' } }
				}
			},
			tavern: {
				icon: 'tavern.png',
				workforceMax: 12,
				jobInitHash: {
					bartender: { mustPickFirst: true, onePerVenue: true, icon: { img: 'person.png', holding: 'bartender.png' } },
					bard: { onePerVenue: true, icon: { img: 'person.png', holding: 'bard.png' } },
					server: { icon: { img: 'person.png', holding: 'server.png' } }
				}
			},
			theater: {
				icon: 'theater.png',
				workforceMax: 8,
				jobInitHash: {
					director: { onePerVenue: true, icon: { img: 'person.png', holding: 'director.png' } },
					actor: { useIfSingular: true, icon: { img: 'person.png', holding: 'actor.png' } }
				}
			}
		}
	},
	leadership: {
		icon: 'leadership.png',
		percentOfPopulation: 0.05,
		venueInitHash: {
			palace: {
				icon: 'palace.png',
				onePerCommunity: true,
				alwaysMaxWorkforce: true,
				jobInitHash: {
					ruler: { onePerVenue: true, mustPickFirst: true, icon: { img: 'person.png', holding: 'ruler.png' } },
					planner: { onePerVenue: true, icon: { img: 'person.png', holding: 'planner.png' } },
					functionary: { icon: { img: 'person.png', holding: 'planner.png' } },
					servant: { icon: { img: 'person.png', holding: 'servant.png' } },
				}
			},
			estate: {
				icon: 'estate.png',
				workforceMax: 12,
				jobInitHash: {
					noble: { onePerVenue: true, mustPickFirst: true, icon: { img: 'person.png', holding: 'noble.png' } },
					servant: { icon: { img: 'person.png', holding: 'servant.png' } }
				}
			}
		}
	},
	children: {
		isHidden: true,
		percentOfPopulation: 0.18,
		venueInitHash: {
			family: {
				icon: 'children.png',
				jobInitHash: {
					child: { isChild: true, icon: 'children.png' }
				}
			}
		}
	},
	gear: {
		icon: 'goods.png',
		percentOfPopulation: 0.20,
		venueInitHash: {
			caravan: {
				icon: 'muleLaden.png',
				isTradeRoute: true,
				chance: 5,
				workforceRatio: 0.20,	// double the usual
				workforceMax: 6,
				jobInitHash: {
					trader: { icon: { img: 'person.png', holding: 'trader.png' } }
				}
			},
			peddlerWagon: {					// basically an itinerant trader
				icon: 'muleLaden.png',
				workforceRatio: 0.001,
				workforceMax: 2,
				jobInitHash: {
					peddler: { icon: { img: 'person.png', holding: 'trader.png' } }
				}
			},
			bloomery: {
				icon: 'bloomery.png',
				workforceMax: 12,
				jobInitHash: {
					smelterForeman: { onePerVenue: true, icon: { img: 'person.png', holding: 'bloomery.png' } },
					smelter: { useIfSingular: true, icon: { img: 'person.png', holding: 'bloomery.png' } }
				}
			},
			brewery: {
				icon: 'brewer.png',
				workforceMax: 12,
				jobInitHash: {
					brewer: { icon: { img: 'person.png', holding: 'brewer.png' } },
				}
			},
			clothier: {
				icon: 'clothier.png',
				workforceMax: 4,
				jobInitHash: {
					clothier: { icon: { img: 'person.png', holding: 'clothier.png' } },
					tailor: { icon: { img: 'person.png', holding: 'tailor.png' } },
					haberdasher: { icon: { img: 'person.png', holding: 'clothier.png' } },
					cobbler: { icon: { img: 'person.png', holding: 'cobbler.png' } },
				}
			},
			armorer: {
				icon: 'armor.png',
				workforceMax: 8,
				jobInitHash: {
					armorer: { mustPickFirst: true, icon: { img: 'person.png', holding: 'armor.png' } },
					gaunter: { icon: { img: 'person.png', holding: 'armor.png' } }
				}
			},
			bowyery: {
				icon: 'bow.png',
				workforceMax: 6,
				jobInitHash: {
					bowyer: { mustPickFirst: true, icon: { img: 'person.png', holding: 'bow.png' }  },
					fletcher: { icon: { img: 'person.png', holding: 'fletcher.png' } }
				}
			},
			jeweler: {
				icon: 'jeweler.png',
				workforceMax: 4,
				jobInitHash: {
					jeweler: { mustPickFirst: true, icon: { img: 'person.png', holding: 'jeweler.png' } },
					lapidary: { icon: { img: 'person.png', holding: 'lapidary.png' } }
				}
			},
			glassBlower: {
				icon: 'glass.png',
				workforceMax: 8,
				jobInitHash: {
					glassBlower: { icon: { img: 'person.png', holding: 'glass.png' } }
				}
			},
			mine: {
				icon: 'miner.png',
				workforceMax: 40,
				jobInitHash: {
					mineForeman: { mustPickFirst: true, onePerVenue: true, icon: { img: 'person.png', holding: 'miner.png' } },
					miner: { useIfSingular: true, icon: { img: 'person.png', holding: 'miner.png' } }
				}
			},
			smithy: {
				icon: 'smith.png',
				workforceMax: 6,
				jobInitHash: {
					blacksmith: { mustPickFirst: true, icon: { img: 'person.png', holding: 'smith.png' } },
					smithApprentice: { icon: { img: 'person.png', holding: 'smith.png' } }
				}
			}
		}
	},
	wisdom: {
		icon: 'book.png',
		percentOfPopulation: 0.05,
		venueInitHash: {
			library: {
				icon: 'library.png',
				workforceMax: 20,
				jobInitHash: {
					librarian: { icon: { img: 'person.png', holding: 'library.png' } }
				}
			},
			school: {
				icon: 'school.png',
				workforceMax: 20,
				jobInitHash: {
					teacher: { useIfSingular: true, icon: { img: 'person.png', holding: 'school.png' } },
					principle: { icon: { img: 'person.png', holding: 'school.png' } }
				}
			},
			temple: {
				icon: 'temple.png',
				workforceMax: 12,
				jobInitHash: {
					priest: { mustPickFirst: true, icon: { img: 'person.png', holding: 'priest.png' } },
					acolyte: { icon: { img: 'person.png', holding: 'priest.png' } }
				}
			},
			scriptorium: {
				icon: 'scribe.png',
				workforceMax: 8,
				jobInitHash: {
					scribe: { icon: { img: 'person.png', holding: 'scribe.png' } }
				}
			}
		}
	},
	health: {
		icon: 'doctor.png',
		percentOfPopulation: 0.02,	// A doc can serve 50 people, under normal conditions.
		venueInitHash: {
			doctor: {
				icon: 'doctor.png',
				workforceMax: 2,
				chance: 80,
				jobInitHash: {
					doctor: { mustPickFirst: true, icon: { img: 'person.png', holding: 'doctor.png' } },
					nurse: { icon: { img: 'person.png', holding: 'doctor.png' } }
				}
			},
			hospital: {
				icon: 'doctor.png',
				workforceMax: 20,
				jobInitHash: {
					doctor: { mustPickFirst: true, icon: { img: 'person.png', holding: 'doctor.png' } },
					nurse: { icon: { img: 'person.png', holding: 'doctor.png' } }
				}
			}
		}
	},
	indigent: {
		icon: 'beggar.png',
		isHidden: true,
		percentOfPopulation: 0.05,
		neverProductive: true,
		venueInitHash: {
			around: {
				icon: 'beggar.png',
				chance: 0.10,
				jobInitHash: {
					bum: { icon: { img: 'person.png', holding: 'beggar.png' } }
				}
			}
		}
	}
};
/**
	AspectType
	percentOfPopulation	- how much of the pop will do this job
	popServedPerWorker	- how many people will be served by one worker of normal skill at this job
	venueTypeHash {}	- all the venues that produce this aspect
	jobTypeHash {}		- what job types produce this aspect
*/

/**
	JobType
	-------
	id					- unique jobTypeId
	name				- name of this job type
	venueType		- venueType that this job works at
	produces			- what this job produces
	workerImpact		- the number of people a single worker at this job can serve with nominal skill
	mustPickFirst
	useIfSingular
	onePerVenue
	producesId			- if you'd like to overload what this guy produces.
*/
let JobTypeHash = {
};

/**
	VenueType
	---------
	id					- unique venueTypeId
	name				- what this venue is called
	jobTypeHash			- what jobs work at this venue
	workerCapacity		- (Venue) how many workers this venue has utilize
	workers {}			- (Venue) who my workers actually are
*/

let VenueTypeHash = {
};


let totalPercentOfPopulation = 0;

Object.each( AspectTypeHash, (aspectType,aspectTypeId) => {
	aspectType.id				= aspectTypeId;
	aspectType.isAspectType		= true;
	aspectType.venueTypeHash	= {};
	aspectType.jobTypeHash		= {};

	// Normally each venue can consume an equal number of workers.
	aspectType.workforceRatio = 1/Object.count(aspectType.venueInitHash);
	//console.log(aspectTypeId,aspectType.workforceRatio);

	totalPercentOfPopulation += (aspectType.percentOfPopulation||0);
	aspectType.workerImpact = !aspectType.percentOfPopulation ? 0 : 1 / aspectType.percentOfPopulation;

	// Initialize global hashes, and also my local hashes.
	Object.each( aspectType.venueInitHash, (venueInit,venueTypeId) => {
		VenueTypeHash[venueTypeId] = VenueTypeHash[venueTypeId] || {};
		aspectType.venueTypeHash[venueTypeId] = VenueTypeHash[venueTypeId];
		Object.each( venueInit.jobInitHash, (jobInit,jobTypeId) => {
			JobTypeHash[jobTypeId] = JobTypeHash[jobTypeId] || {};
			aspectType.jobTypeHash[jobTypeId] = JobTypeHash[jobTypeId];
		});
	});

	// Fill in the members of each.
	Object.each( aspectType.venueInitHash, (venueInit,venueTypeId) => {

		// Assign the VenueType
		Object.assign(
			VenueTypeHash[venueTypeId],
			{
				id:					venueTypeId,
				isVenueType:		true,
				//name:				venueTypeId,
				jobTypeHash:		Hash.map( venueInit.jobInitHash, (X,jobTypeId) => JobTypeHash[jobTypeId] ),
				produces:			aspectType
			},
			venueInit
		);

		// Assign the JobType
		Object.each( venueInit.jobInitHash, (jobInit,jobTypeId) => {
			let produces = !jobInit.producesId ? aspectType : AspectTypeHash[jobInit.producesId];
			Object.assign( 
				JobTypeHash[jobTypeId],
				{
					id:				jobTypeId,
					isJobType:		true,
					name:			jobTypeId,
					venueType:	VenueTypeHash[venueTypeId],
					produces:		produces,
					workerImpact:	!produces.percentOfPopulation ? 0 : 1 / produces.percentOfPopulation
				},
				jobInit
			);
		});
	});
});

if( totalPercentOfPopulation != 1.0 ) {
	throw "percentOfPopulation is "+totalPercentOfPopulation+" but must be 1.0";
}


return {
	AspectTypeHash: AspectTypeHash,
	JobTypeHash: JobTypeHash,
	VenueTypeHash: VenueTypeHash
}
});
