var _youreNotMyFriend = (function() {
	var debug = !('update_url' in chrome.runtime.getManifest());	//checks whether the runtime was downloaded from the store or not

	var ui = (function() {
		//caches zepto elements
		var elements = {};

		function _getElement(id, selector, static) {
			if (typeof static === 'undefined') static = false;
			if (id in elements && static) {
				return elements[id];
			} else {
				var element = $(selector);
				if (element.length && static) {
					elements[id] = element;
				}
				return element;
			}
		}

		return {
			getAddConnectionsButton: function() {return _getElement('connections-button', '.activity-tab[data-li-activity-type="addconnections"]', true)},
			getPeopleList: function() {return _getElement('people-list', '.activity-container #connection-tab-top-container .connection-tab-people-list li')},
			getInvitationCount: function() {return _getElement('inv-count', '#header-invitations-count')}
		};
	})();

	var log = function(obj) {
		//appends the app name to console.log calls
		if (debug) console.log('You\'re Not My Friend: ', obj)
	}

	var app = (function() {
		//app main
		log('Init');
		var active = false;	//tracks whether or not we're actively querying the dom

		$(ui.getAddConnectionsButton()).on('mouseover', function() {
			//when hovering the add connections button..
			if (!active) {
				active = true;
				log('Hovered invites');

				var count = 0;	//tracks number of intervals
				var timeout = 5;	//seconds
				var intervalInterval = 0.5; //seconds 

				//wait for the dropdown data to load
				var interval = setInterval(function() {
					//if the data exists
					if (ui.getPeopleList().length) {
						clearInterval(interval);

						var invites = $(ui.getInvitationCount()).attr('data-gem-pending-invites');
						//and we have pending invites
						if (invites) {
							//check each invitation's title for the word recruiter
							$(ui.getPeopleList()).each(function(key, val) {
								var self = this;
								var name = $(this).find('.item-primary-headline a').text();
								var title = $(this).find('.item-secondary-headline').text();
								var fullName = name+' ('+title+')';

								if (title.toLowerCase().indexOf('recruiter') > -1) {
									//if it's there, click ignore
									log(fullName+' is not my friend');
									$(this).find('.connection-item-action[data-li-trk-code="nav_utilities_invites_ignore"]').click();

									count = 0;
									//wait for the ignore request data to load
									interval = setInterval(function() {
										//if the data exists
										if ($(self).find('.ignore-confirmation').length) {
											//we've successfully ignored a recruiter
											log('Ignored '+fullName);

											//click 'report as spam'
											// $(self).find('.ignore-confirmation a[data-action="invitationReportAbuse"]').click();

											//click 'I don't know this person'
											$(self).find('.ignore-confirmation a[data-action="invitationDecline"]').click();
											active = false;
										} else if (++count * intervalInterval*1000 >= timeout*1000) {
											//if the data fails to load, do nothing
											log(fullName+' ignore request timed out, yo');
											clearInterval(interval);
											active = false;
										}
									}, intervalInterval*1000)
								} else {
									//if it's not, do nothing
									log(name+'('+title+') might be my friend');
								}
							})
						}
					} else if (++count * intervalInterval*1000 >= timeout*1000) {
						//if the data fails to load, do nothing
						log('Invitation list request timed out, yo');
						clearInterval(interval);
						active = false;
					}
				}, intervalInterval*1000);
			}
		});
	})();
})();