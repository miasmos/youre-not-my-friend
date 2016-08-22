(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-76738709-1', 'auto');
ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga('require', 'displayfeatures');
ga('send', 'pageview', '/background.html');

var _youreNotMyFriend = (function() {
	var debug = !('update_url' in chrome.runtime.getManifest());	//checks whether the runtime was downloaded from the store or not

	var track = (function() {
		function _send(c,a,l) {
			if (!(c && a)) return;
			if (typeof l !== 'undefined') {
				ga('send', 'event', c, a, l);
			} else {
				ga('send', 'event', c, a);
			}
		}

		return {
			ignoredUser: function(name,title) {return _send('LinkedIn', 'Ignored User', name+"|"+title)}
		}
	})();

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
			getAddConnectionsButton: function() {return _getElement('connections-button', '.activity-tab[data-li-activity-type="addconnections"] #dropdowntest', true)},
			getActivityDropdown: function() {return _getElement('activity-container', '.activity-container .activity-drop', true)},
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
					if (ui.getActivityDropdown().last().hasClass('activity-drop-loading') == false) {
						clearInterval(interval);

						var invites = $(ui.getInvitationCount()).attr('data-gem-pending-invites');
						//and we have pending invites
						if (invites) {
							//check each invitation's title for the word recruiter
							var peopleListLength = ui.getPeopleList().length;
							var completedCount = 0;

							$(ui.getPeopleList()).each(function(key, val) {
								var self = this;
								var name = $(this).find('.item-primary-headline a').text();
								var title = $(this).find('.item-secondary-headline').text();
								var fullName = name+' ('+title+')';

								if ((title.toLowerCase().indexOf('recruiter') > -1 || title.toLowerCase().indexOf('recruitment') > -1) && !$(this).find('.ignore-confirmation').length) {
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
											track.ignoredUser(name,title)

											//click 'report as spam'
											// $(self).find('.ignore-confirmation a[data-action="invitationReportAbuse"]').click();

											//click 'I don't know this person'
											$(self).find('.ignore-confirmation a[data-action="invitationDecline"]').click();
											clearInterval(interval);
											if (++completedCount >= peopleListLength-1) active = false;
										} else if (++count * intervalInterval*1000 >= timeout*1000) {
											//if the data fails to load, do nothing
											log(fullName+' ignore request timed out, yo');
											clearInterval(interval);
											if (++completedCount >= peopleListLength-1) active = false;
										}
									}, intervalInterval*1000)
								} else {
									//if it's not, do nothing
									log(name+'('+title+') might be my friend');
								}
							})
						} else {
							log('No pending invites');
							clearInterval(interval);
							active = false;
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
