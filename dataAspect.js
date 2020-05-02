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
				district: 'outlier',
				tilesPerWorker: 14,
//				domicile: { farmhouse: 9 },		// 9 tiles per inhabitant; if domicile not specified, it is just a house:9
//				venue: { field: 15 },		// if not specified, it is the same as the venuename
				jobInitHash: {
					farmer: {
						onePerVenue: true, useIfSingular: true, mustPickFirst: true, icon: { img: 'person.png', holding: 'farmer.png' },
						wealth: 'medium', houseAtWorkplace: true
					},
					farmHand: {
						icon: { img: 'person.png', holding: 'farmer.png' },
						wealth: 'low', houseAtWorkplace: true
					},
				}
			},
			pasture: {
				icon: 'field.png',
				workforceMax: 20,
				district: 'outlier',
				tilesPerWorker: 20,
				jobInitHash: {
					shepherd: {
						icon: { img: 'person.png', holding: 'shepherd.png' },
						wealth: 'low', houseAtWorkplace: true
					},
					cowboy: {
						icon: { img: 'person.png', holding: 'shepherd.png' },
						wealth: 'low', houseAtWorkplace: true
					}
				}
			},
			foodCaravan: {
				icon: 'muleFood.png',
				isTradeRoute: true,
				workforceMax: 20,
				district: 'market',
				jobInitHash: {
					foodTrader: {
						icon: { img: 'person.png', iconHolding: 'food.png' },
						wealth: 'low'
					},
				}
			},
			garden: {
				icon: 'garden.png',
				neverPickFirst: true,
				workforceMax: 5,
				district: 'residential',
				tilesPerWorker: 2,
				jobInitHash: {
					botanist: {
						icon: { img: 'person.png', iconHolding: 'garden.png' },
						wealth: 'medium'
					},
					beeKeeper: {
						icon: { img: 'person.png', iconHolding: 'beeKeeperHolding.png' },
						wealth: 'medium'
					},
				}
			},
			grocery: {
				icon: 'grocery.png',
				neverPickFirst: true,
				workforceMax: 10,
				district: 'market',
				jobInitHash: {
					grocer: {
						icon: { img: 'person.png', iconHolding: 'grocery.png' },
						wealth: 'medium'
					}
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
				district: 'wealthy',
				jobInitHash: {
					mason: {
						icon: { img: 'person.png', holding: 'mason.png' },
						wealth: 'high'
					},
					carpenter: {
						icon: { img: 'person.png', holding: 'carpenter.png' },
						wealth: 'low'
					}
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
				district: 'military',
				tilesPerWorker: 2,
				jobInitHash: {
					captain: {
						onePerVenue: true, icon: { img: 'person.png', holding: 'captain.png' },
						wealth: 'medium'
					},
					guard: {
						useIfSingular: true,  icon: { img: 'person.png', holding: 'guard.png' },
						wealth: 'low'
					},
					medic: { 
						chance: 0.10,	// About 10% of a battalion is medics.
						producesId: 'health',
						whole: true,
						well: false,
						icon: { img: 'person.png', holding: 'doctor.png' },
						wealth: 'medium'
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
				district: 'any',
				jobInitHash: {
					artist: {
						icon: { img: 'person.png', overlay: 'artist.png' },
						wealth: 'low'
					}
				}
			},
			tavern: {
				icon: 'tavern.png',
				workforceMax: 12,
				district: 'any',
				tilesPerWorker: 3,
				jobInitHash: {
					bartender: {
						mustPickFirst: true, onePerVenue: true, icon: { img: 'person.png', holding: 'bartender.png' },
						wealth: 'low'
					},
					bard: {
						onePerVenue: true, icon: { img: 'person.png', holding: 'bard.png' },
						wealthBySkill: true
					},
					server: {
						icon: { img: 'person.png', holding: 'server.png' },
						wealth: 'low'
					}
				}
			},
			theater: {
				icon: 'theater.png',
				workforceMax: 8,
				district: 'any',
				tilesPerWorker: 3,
				jobInitHash: {
					director: {
						onePerVenue: true, icon: { img: 'person.png', holding: 'director.png' },
						wealth: 'low'
					},
					actor: {
						useIfSingular: true, icon: { img: 'person.png', holding: 'actor.png' },
						wealth: 'low'
					}
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
				district: 'wealthy',
				tilesPerWorker: 5,
				jobInitHash: {
					ruler: {
						onePerVenue: true, mustPickFirst: true, icon: { img: 'person.png', holding: 'ruler.png' },
						wealth: 'high'
					},
					planner: {
						onePerVenue: true, icon: { img: 'person.png', holding: 'planner.png' },
						wealth: 'medium'
					},
					functionary: {
						icon: { img: 'person.png', holding: 'planner.png' },
						wealth: 'medium'
					},
					servant: {
						icon: { img: 'person.png', holding: 'servant.png' },
						wealth: 'low'
					},
				}
			},
			estate: {
				icon: 'estate.png',
				workforceMax: 12,
				district: 'wealthy',
				tilesPerWorker: 3,
				jobInitHash: {
					noble: {
						onePerVenue: true, mustPickFirst: true, icon: { img: 'person.png', holding: 'noble.png' },
						wealth: 'medium'
					},
					servant: {
						icon: { img: 'person.png', holding: 'servant.png' },
						wealth: 'low'
					}
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
				district: 'market',
				jobInitHash: {
					trader: {
						icon: { img: 'person.png', holding: 'trader.png' },
						wealth: 'medium'
					}
				}
			},
			peddlerWagon: {					// basically an itinerant trader
				icon: 'muleLaden.png',
				workforceRatio: 0.001,
				workforceMax: 2,
				district: 'any',
				jobInitHash: {
					peddler: {
						icon: { img: 'person.png', holding: 'trader.png' },
						wealth: 'low'
					}
				}
			},
			bloomery: {
				icon: 'bloomery.png',
				workforceMax: 12,
				district: 'industrial',
				jobInitHash: {
					smelterForeman: {
						onePerVenue: true, icon: { img: 'person.png', holding: 'bloomery.png' },
						wealth: 'medium'
					},
					smelter: {
						useIfSingular: true, icon: { img: 'person.png', holding: 'bloomery.png' },
						wealth: 'low'
					}
				}
			},
			brewery: {
				icon: 'brewer.png',
				workforceMax: 12,
				district: 'any',
				jobInitHash: {
					brewer: {
						icon: { img: 'person.png', holding: 'brewer.png' },
						wealth: 'medium'
					},
				}
			},
			clothier: {
				icon: 'clothier.png',
				workforceMax: 4,
				district: 'market',
				jobInitHash: {
					clothier: {
						icon: { img: 'person.png', holding: 'clothier.png' },
						wealth: 'low'
					},
					tailor: {
						icon: { img: 'person.png', holding: 'tailor.png' },
						wealth: 'medium'
					},
					haberdasher: {
						icon: { img: 'person.png', holding: 'clothier.png' },
						wealth: 'low'
					},
					cobbler: {
						icon: { img: 'person.png', holding: 'cobbler.png' },
						wealth: 'medium'
					},
				}
			},
			armorer: {
				icon: 'armor.png',
				workforceMax: 8,
				district: 'market',
				jobInitHash: {
					armorer: {
						mustPickFirst: true, icon: { img: 'person.png', holding: 'armor.png' },
						wealth: 'high'
					},
					gaunter: {
						icon: { img: 'person.png', holding: 'armor.png' },
						wealth: 'medium'
					}
				}
			},
			bowyery: {
				icon: 'bow.png',
				workforceMax: 6,
				district: 'market',
				jobInitHash: {
					bowyer: {
						mustPickFirst: true, icon: { img: 'person.png', holding: 'bow.png' },
						wealth: 'medium'
					},
					fletcher: {
						icon: { img: 'person.png', holding: 'fletcher.png' },
						wealth: 'low'
					}
				}
			},
			jeweler: {
				icon: 'jeweler.png',
				workforceMax: 4,
				district: 'wealthy',
				jobInitHash: {
					jeweler: {
						mustPickFirst: true, icon: { img: 'person.png', holding: 'jeweler.png' },
						wealth: 'high'
					},
					lapidary: {
						icon: { img: 'person.png', holding: 'lapidary.png' },
						wealth: 'medium'
					}
				}
			},
			glassBlower: {
				icon: 'glass.png',
				workforceMax: 8,
				district: 'industrial',
				jobInitHash: {
					glassBlower: {
						icon: { img: 'person.png', holding: 'glass.png' },
						wealth: 'medium'
					}
				}
			},
			mine: {
				icon: 'miner.png',
				workforceMax: 40,
				district: 'outlier',
				jobInitHash: {
					mineForeman: {
						mustPickFirst: true, onePerVenue: true, icon: { img: 'person.png', holding: 'miner.png' },
						wealth: 'medium'
					},
					miner: {
						useIfSingular: true, icon: { img: 'person.png', holding: 'miner.png' },
						wealth: 'low'
					}
				}
			},
			smithy: {
				icon: 'smith.png',
				workforceMax: 6,
				district: 'industrial',
				jobInitHash: {
					blacksmith: {
						mustPickFirst: true, icon: { img: 'person.png', holding: 'smith.png' },
						wealth: 'medium'
					},
					smithApprentice: {
						icon: { img: 'person.png', holding: 'smith.png' },
						wealth: 'low'
					}
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
				district: 'residential',
				tilesPerWorker: 5,
				jobInitHash: {
					librarian: {
						icon: { img: 'person.png', holding: 'library.png' },
						wealth: 'low'
					}
				}
			},
			school: {
				icon: 'school.png',
				workforceMax: 20,
				district: 'residential',
				tilesPerWorker: 5,
				jobInitHash: {
					principle: {
						icon: { img: 'person.png', holding: 'school.png' },
						wealth: 'medium'
					},
					teacher: {
						useIfSingular: true, icon: { img: 'person.png', holding: 'school.png' },
						wealth: 'low'
					},
				}
			},
			temple: {
				icon: 'temple.png',
				workforceMax: 12,
				district: 'wealthy',
				tilesPerWorker: 5,	// gives 0.25 tiles per person served.
				jobInitHash: {
					priest: {
						mustPickFirst: true, icon: { img: 'person.png', holding: 'priest.png' },
						wealth: 'medium'
					},
					acolyte: {
						icon: { img: 'person.png', holding: 'priest.png' },
						wealth: 'low'
					}
				}
			},
			scriptorium: {
				icon: 'scribe.png',
				workforceMax: 8,
				district: 'wealthy',
				jobInitHash: {
					scribe: {
						icon: { img: 'person.png', holding: 'scribe.png' },
						wealth: 'medium'
					}
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
				district: 'any',
				jobInitHash: {
					doctor: {
						mustPickFirst: true, icon: { img: 'person.png', holding: 'doctor.png' },
						wealth: 'high'
					},
					nurse: {
						icon: { img: 'person.png', holding: 'doctor.png' },
						wealth: 'medium'
					}
				}
			},
			hospital: {
				icon: 'doctor.png',
				workforceMax: 20,
				district: 'wealthy',
				jobInitHash: {
					doctor: {},
					nurse: {}
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
				isFakeVenue: true,
				jobInitHash: {
					child: {
						icon: { img: 'children.png' },
						isChild: true,
						wealth: null
					}
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
				isFakeVenue: true,
				jobInitHash: {
					bum: {
						icon: { img: 'person.png', holding: 'beggar.png' },
						wealth: 'low'
					}
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
