// ==UserScript==
// @name           theme helper
// @description    Adds extra data/classes to elements in order to css them properly
// @author         Burkes
// @include		   https://plug.dj/*
// @include        https://*.plug.dj/*
// @exclude        https://plug.dj/_/*
// @exclude        https://plug.dj/ba
// @exclude        https://plug.dj/plot
// @exclude        https://plug.dj/press
// @exclude        https://plug.dj/merch
// @exclude        https://plug.dj/partners
// @exclude        https://plug.dj/founders
// @exclude        https://plug.dj/team
// @exclude        https://plug.dj/about
// @exclude        https://plug.dj/jobs
// @exclude        https://plug.dj/purchase
// @exclude        https://plug.dj/subscribe
// @exclude        https://*.plug.dj/_/*
// @exclude        https://*.plug.dj/@/*
// @exclude        https://*.plug.dj/ba
// @exclude        https://*.plug.dj/plot
// @exclude        https://*.plug.dj/press
// @exclude        https://*.plug.dj/partners
// @exclude        https://*.plug.dj/team
// @exclude        https://*.plug.dj/about
// @exclude        https://*.plug.dj/jobs
// @exclude        https://*.plug.dj/purchase
// @exclude        https://*.plug.dj/subscribe

// @version        1.0
// @grant          none
// ==/UserScript==

function isObject(input) {
	return typeof input === 'object';
}

function isFunction(input) {
	return typeof input === 'function';
}

function isString(input) {
	return typeof input === 'string';
}

RegExp.escape = function(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

(function() {
	var start = Date.now();

	function check() {
		if (isObject(window.API) && API.enabled && isFunction(window.$) && window.$('#room').length > 0) {
			return run();
		}

		return setTimeout(check, 100);
	}

	function run () {
		console.info('[!] Ready in ' + (Date.now() - start) + 'ms');

		window.plugModules = {
			modules: {},
			get: function Util(name) {
				return this.modules[name];
			},
			set: function Util(module, name) {
				this.modules[name] = module;

				return module;
			}
		};

		window.jumbomojiEnabled = true;

		var requireModules = window.require.s.contexts._.defined;

		for (var i in requireModules) {
			var module = requireModules[i];

			if (!module) continue;

			if (isFunction(module.onChatReceived) && isFunction(module.checkMutes)) {
				window.plugModules.set(module, 'facades/chatFacade');
			}

			if (module.prototype && isFunction(module.prototype.onFavorite) && isFunction(module.prototype.onFriends)) {
				window.plugModules.set(module, 'views/dashboardCell');
			}

			if (module.prototype && isFunction(module.prototype.update) && isFunction(module.prototype.vote)) {
				window.plugModules.set(module, 'views/roomUserRowView');
			}

			if (module.prototype && isFunction(module.prototype.render) && module.prototype.id === 'chat') {
				window.plugModules.set(module, 'views/chatView');
			}

			if (Array.isArray(module._l) && Array.isArray(module._x)) {
				window.plugModules.set(module, 'models/currentUser');
			}

			if (module instanceof window.Backbone.Model && 'fx' in module.attributes) {
				window.plugModules.set(module, 'models/currentRoom');
			}

			if (module instanceof window.Backbone.Collection && isFunction(module.getAudience)) {
				window.plugModules.set(module, 'collections/users');
			}

			if (module instanceof window.Backbone.Collection && 'isTheUserPlaying' in module) {
				window.plugModules.set(module, 'collections/waitlist');
			}

			if (module.prototype && module.prototype.defaults && 'avatarID' in module.prototype.defaults && 'role' in module.prototype.defaults) {
				window.plugModules.set(module, 'models/User');
			}

			if (isFunction(module.dispatch) && module.dispatch.length === 1) {
				window.plugModules.set(module, 'core/Events');
			}

			if (isFunction(module.h2t)) {
				window.plugModules.set(module, 'util/util');
			}

			if ('csspopout' in module && 'scThumbnail' in module) {
				window.plugModules.set(module, 'util/urls');
			}

			if (module && isObject(module.settings)) {
				window.plugModules.set(module, 'store/settings');
			}

			if (module && module.comparator === 'username') {
				window.plugModules.set(module, 'collections/ignores');
			}

			if (module && isFunction(module.replace_emoticons)) {
				window.plugModules.set(module, 'util/emoji');
			}
		}

		var roomUserRowView = window.plugModules.get('views/roomUserRowView');
		var dashboardCell = window.plugModules.get('views/dashboardCell');
		var currentUser = window.plugModules.get('models/currentUser');
		var currentRoom = window.plugModules.get('models/currentRoom');
		var chatFacade = window.plugModules.get('facades/chatFacade');
		var waitlist = window.plugModules.get('collections/waitlist');
		var chatView = window.plugModules.get('views/chatView');
		var settings = window.plugModules.get('store/settings');
		var ignores = window.plugModules.get('collections/ignores');
		var users = window.plugModules.get('collections/users');
		var Events = window.plugModules.get('core/Events');
		var emoji = window.plugModules.get('util/emoji');
		var User = window.plugModules.get('models/User');
		var urls = window.plugModules.get('util/urls');
		var util = _$ = window.plugModules.get('util/util');
		var Lang = window.require('lang/Lang');
		var _ = window.require('underscore');

		// enable small cards
		$('#dashboard').addClass('small-cards');
		// enable user style
		if (currentUser) {
			$('#app').addClass('user-' + currentUser.get('id'));
		}

		// improve dashboard selectors
		if (dashboardCell) {
			var oldDashboardCellRender = dashboardCell.prototype.render;

			dashboardCell.prototype.render = function newDashboardCellRender () {
				oldDashboardCellRender.call(this);

				if (this.model.get('nsfw')) {
					this.$el.addClass('is-nsfw');
				}

				this.$el.addClass('slug-' + this.model.get('slug'));

				if (this.model.get('population') === 0) {
					this.$el.addClass('is-empty');
				}
			};
		}

		// improve user list
		if (roomUserRowView) {
			var oldRoomUserRowViewRender = roomUserRowView.prototype.render;

			roomUserRowView.prototype.render = function newRoomUserRowViewRender () {
				oldRoomUserRowViewRender.call(this);

				this.$el.addClass('user-' + this.model.get('id'));
				this.$el.addClass('level-' + this.model.get('level'));
			};
		}

		// improve chat
		if (chatFacade) {
			var chatFacadeOldOnChatReceived = chatFacade.onChatReceived;

			chatFacade.onChatReceived = function newChatFacadeOnChatReceived (eventData, internal, muted) {
				var emojiRegex = /:[^:\s]+:/g;
				var emoteRegex = /^\/(em|me)\s/;
				var mentionRegex = /@(everyone|hosts|managers|bouncers|rdjs|staff|djs|guests)/gi;
				var urlRegex = /\b((?:https?:\/\/|www\d{0,3}\.|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
				var imgRegex = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]\.(?:jpg|gif|png)\b)/gi;
				var whitelistRegex = /(((blog|tech|support|status|stg)\.plug\.dj)|plug\.dj\/(\@\/|\!\/|\_\/|dashboard|about|founders|team|ba|plot|partners|merch|press|jobs|(purchase|giftsub)(\/[0-9]+)?|subscribe|terms|privacy|legal|(mobile|site)(features|bugs)|(android|ios)\-((landing|force|events)\-page|site\-alert|launchrock\-list|all\-users|fb|twitter|instagram|reddit|blog|ba|left\-nav|(index|community)\-footer|events-page))($|\/))/;

				if (!eventData.uid || (!this.mutes[eventData.uid] && !ignores.get(eventData.uid)) || muted) {
					eventData.type = eventData.type || 'message';

					if (emoteRegex.test(eventData.message)) {
						eventData.type += ' emote';
						eventData.emote = true;
						eventData.message = eventData.message.replace(emoteRegex, '');
					}

					if (window.jumbomojiEnabled) {
						emoji.text_mode = true;
						var messageWithColons = emoji.replace_unified(emoji.replace_colons(emoji.replace_emoticons_with_colons(eventData.message), true, false, false));
						emoji.text_mode = false;
						
						var emojisInMessage = messageWithColons.match(emojiRegex);

						if (Array.isArray(emojisInMessage) && emojisInMessage.length <= 6) {
							if (!messageWithColons.replace(emojiRegex, '').trim().length) {
								eventData.jumbomoji = true;
							}
						}
					}

					var currentMentions = [];
					var sender = eventData.uid ? users.get(eventData.uid) : void 0;
					var role = currentUser.get('role');

					if (sender) {
						if (sender.get('level') < currentRoom.get('minChatLevel')) return;
						if (sender.hasPermission(User.MANAGER) && mentionRegex.test(eventData.message)) {
							var mention = eventData.message.match(mentionRegex);

							if (Array.isArray(mention)) {
								for (var length = mention.length, i = 0; i < length; i++) {
									var group = mention[i];

									if ((group === '@everyone' && (role > User.MANAGER || sender.get('gRole') >= User.MANAGER)) ||
										(group === '@hosts' && (role === User.COHOST || role === User.HOST)) ||
										(group === '@managers' && role === User.MANAGER) ||
										(group === '@bouncers' && role === User.BOUNCER) ||
										(group === '@rdjs' && role === User.DJ) ||
										(group === '@staff' && role > User.DJ) ||
										(group === '@djs' && (waitlist.isTheUserPlaying || waitlist.isTheUserWaiting)) ||
										(group === '@guests' && (role > User.MANAGER || sender.get('gRole') >= User.MANAGER) && currentUser.get('guest'))) {
										currentMentions.push(group.replace(group, '<$&>'));

										eventData.message = eventData.message.replace(new RegExp(group, 'g'), '<\$&>');
									}
								}
							}
						}
					}

					var roomMentionRegex = new RegExp('(?!@)(' + users.map(u => RegExp.escape(u.get('username')))
						.sort((a, b) => a.length > b.length ? -1 : b.length > a.length ? 1 : 0).join('|') + ')', 'g');
					var match = eventData.message.match(roomMentionRegex);

					if (match && Array.isArray(match)) {
						for (var length = match.length, i = 0; i < length; i++) {
							var user = users.find(user => user.get('username') === match[i]);

							if (user) {
								eventData.message = eventData.message.replace(new RegExp('@' + RegExp.escape(match[i])), '<@' + user.get('id') + '>');
							}
						}
					}

					if (eventData.message.match(new RegExp('<@' + currentUser.get('id') + '>'))) {
						currentMentions.push('<@' + currentUser.get('id') + '>');
					}

					if (currentMentions.length) {
						eventData.type += ' mention';
						eventData.mentions = currentMentions;
					}

					eventData.timestamp = _$.getChatTimestamp(24 === settings.settings.chatTimestamps);

					var parseLink = function Util(message, messageObject, internal) {
						var skip = false;

						if (message.indexOf('--over-max-size--') > -1) {
							message = message.split('--over-max-size--').join('[' + Lang.chat.imageMax + ']');
							skip = true;
						}

						if (message.indexOf('--not-found--') > -1) {
							message = message.split('--not-found--').join('[' + Lang.chat.image404 + ']');
							skip = true;
						}

						if (message.indexOf('--error--') > -1) {
							message = message.split('--error--').join('[' + Lang.errors.error + ']');
							skip = true;
						}

						if (message.indexOf('http') === -1) return message;

						if (isObject(messageObject) && !skip) {
							messageObject.images = {};

							var loadingClass,
								beforeLink = '',
								afterLink = '';

							message = message.replace(imgRegex, function(link) {
								var positionOfChunk = message.indexOf(link);

								if (positionOfChunk > 0 && ' ' == message.charAt(positionOfChunk - 1)) {
									beforeLink = '<br/>';
								}

								if (' ' == message.charAt(positionOfChunk + link.length)) {
									afterLink = '<br/>';
								}

								loadingClass = (messageObject.uid ? messageObject.uid : 0) + '-' + (~~(2147483646 * Math.random())).toString(16);
								messageObject.images[loadingClass] = link;

								return ('<span class="iph iph-' + loadingClass + (beforeLink ? ' break-before' : '') + (afterLink ? ' break-after' : '') + '">' +
									beforeLink + '<div class="loading-circle"></div>' + afterLink + '</span>');
							});
						}

						if (!internal) {
							message = message.replace(urlRegex, function(link) {
								var target = whitelistRegex.test(link) || link.indexOf('plug.dj') === -1 ? '_blank' : '_self';

								return '<a href="' + link + '" target="' + target + '">' + link + '</a>';
							});
						}

						return message;
					};

					eventData.message = parseLink(eventData.message, eventData, muted);

					if (eventData.uid && currentMentions.length && settings.settings.chatSound) {
						eventData.sound = 'mention';
					}

					if (['user-action', 'moderation'].indexOf(eventData.type) === -1) {
				        if (settings.settings.emoji) {
				        	emoji.text_mode = false;
				        } else {
				        	emoji.text_mode = true;
				        }

						eventData.message = emoji.replace_unified(emoji.replace_colons(emoji.replace_emoticons_with_colons(eventData.message), false, false, false));
					}

					emoji.text_mode = false;
					Events.trigger('chat:receive', eventData, internal);
				}
			};
		}

		if (chatView) {
			var chatViewOldOnReceived = chatView.prototype.onReceived;

			chatView.prototype.onReceived = function newChatViewOnReceived (eventData) {
				try {
					if (!/message|emote|mention/i.test(eventData.type)) {
						this.lastID = this.lastType = void 0;
					}

					var $element = window.$('<div/>').addClass('cm ' + eventData.type);
					var isClass = this.getIsClass();

					var matches = eventData.message.match(new RegExp('(?!<@)(everyone|hosts|managers|bouncers|rdjs|staff|djs|guests|' + users.map(user => user.get('id')).join('|') + ')(?=>)', 'g'));

					if (Array.isArray(matches)) {
						for (var length = matches.length, i = 0; i < length; i++) {
							var mention = matches[i];
							var mentionGroupsRegex = /everyone|hosts|managers|bouncers|rdjs|staff|djs|guests/gi;

							var user = !mentionGroupsRegex.test(mention) ? users.get(mention) : void 0;
							var name = '@';
							var mentionClass = 'name';

							if (/mention/i.test(eventData.type)) {
								$element.addClass(isClass);
								mentionClass += ' mention';
							}

							if (!user) {
								name += mention;
								mentionClass += ' ' + mention;
							} else {
								name += user.get('username');
								mentionClass += ' id-' + user.get('id');
								mentionClass += ' gRole-' + user.get('gRole');
								mentionClass += ' role-' + user.get('role');
							}

							eventData.message = eventData.message.split('<@' + matches[i] + '>').join('<span class="' + mentionClass + '">' + name + '</span>');
						}
					}

					if (eventData.type !== 'system' && this.isMentionFilterOn) {
						element.hide();
					}

					var clickable, $timestamp, $badgeBox, merged, canModChat = true;
					var $message = window.$('<div/>').addClass('msg');
					var $from = window.$('<div/>');

					if (eventData.un) {
						$badgeBox = window.$('<div/>').addClass('badge-box');

						var sender,
							fromClass = 'from';

						if (eventData.uid) {
							sender = users.get(eventData.uid);

							if (this.lastID === eventData.uid && ((/emote/i.test(this.lastType) && /emote/i.test(eventData.type)) || !/emote/i.test(this.lastType) && !/emote/i.test(eventData.type))) {
								merged = true;
								this.lastText.closest('.msg').append(this.lastText = window.$('<div/>')
									.addClass('text').addClass('cid-' + eventData.cid).html(eventData.message));

								if (/mention/i.test(eventData.type)) {
									this.lastText.closest('.cm').addClass(isClass + ' mention');
								}
							} else {
								this.lastID = eventData.uid;
								this.lastType = eventData.type;

								if (sender && sender.get('badge') && sender.get('badge') !== 'blankb') {
									$badgeBox.append(window.$('<i/>').addClass('bdg bdg-' + util.badgeClass(sender.get('badge'))));
								} else {
									$badgeBox.addClass('no-badge').append(window.$('<i/>'));
								}

								if (sender) {
									if (sender.hasPermission(User.ADMIN, true)) {
										if (sender.get('role') > User.MANAGER) {
											$from.append('<i class="icon icon-chat-host"></i>');
											fromClass += ' has-staff';
										} else if (sender.get('role') === User.MANAGER) {
											$from.append('<i class="icon icon-chat-manager"></i>');
											fromClass += ' has-staff';
										} else if (sender.get('role') === User.BOUNCER) {
											$from.append('<i class="icon icon-chat-bouncer"></i>');
											fromClass += ' has-staff';
										} else if (sender.get('role') === User.DJ) {
											$from.append('<i class="icon icon-chat-dj"></i>');
											fromClass += ' has-staff';
										}

										fromClass += ' admin';

										if ('admin-g' !== sender.get('badge')) {
											$from.append('<i class="icon icon-chat-admin"></i>');
										}
									} else if (sender.hasPermission(User.AMBASSADOR, true)) {
										if (sender.get('role') > User.MANAGER) {
											$from.append('<i class="icon icon-chat-host"></i>');
											fromClass += ' has-staff';
										} else if (sender.get('role') === User.MANAGER) {
											$from.append('<i class="icon icon-chat-manager"></i>');
											fromClass += ' has-staff';
										} else if (sender.get('role') === User.BOUNCER) {
											$from.append('<i class="icon icon-chat-bouncer"></i>');
											fromClass += ' has-staff';
										} else if (sender.get('role') === User.DJ) {
											$from.append('<i class="icon icon-chat-dj"></i>');
											fromClass += ' has-staff';
										}

										fromClass += ' ambassador';

										if ('ba-g' !== sender.get('badge')) {
											$from.append('<i class="icon icon-chat-ambassador"></i>');
										}
									} else {
										if (sender.get('sub') > 0 && 'subyearly-g' !== sender.get('badge')) {
											$from.append('<i class="icon icon-chat-subscriber"></i>');
											fromClass += ' has-sub';
										} else if (sender.get('sub') < 1 && sender.get('silver')) {
											$from.append('<i class="icon icon-chat-silver-subscriber"></i>');
											fromClass += ' has-sub';
										}

										if (sender.hasPermission(User.SITEMOD, true)) {
											if (sender.get('role') > User.MANAGER) {
												$from.append('<i class="icon icon-chat-host"></i>');
												fromClass += ' has-staff';
											} else if (sender.get('role') === User.MANAGER) {
												$from.append('<i class="icon icon-chat-manager"></i>');
												fromClass += ' has-staff';
											} else if (sender.get('role') === User.BOUNCER) {
												$from.append('<i class="icon icon-chat-bouncer"></i>');
												fromClass += ' has-staff';
											} else if (sender.get('role') === User.DJ) {
												$from.append('<i class="icon icon-chat-dj"></i>');
												fromClass += ' has-staff';
											}

											fromClass += ' sitemod';
											$from.append('<i class="icon icon-chat-sitemod"></i>');
										} else if (sender.hasPermission(User.PLOT, true)) {
											if (sender.get('role') > User.MANAGER) {
												$from.append('<i class="icon icon-chat-host"></i>');
												fromClass += ' has-staff';
											} else if (sender.get('role') === User.MANAGER) {
												$from.append('<i class="icon icon-chat-manager"></i>');
												fromClass += ' has-staff';
											} else if (sender.get('role') === User.BOUNCER) {
												$from.append('<i class="icon icon-chat-bouncer"></i>');
												fromClass += ' has-staff';
											} else if (sender.get('role') === User.DJ) {
												$from.append('<i class="icon icon-chat-dj"></i>');
												fromClass += ' has-staff';
											}

											fromClass += ' plot';
											$from.append('<i class="icon icon-chat-plot"></i>');
										} else if (sender.hasPermission(User.PROMOTER, true)) {
											if (sender.get('role') > User.MANAGER) {
												$from.append('<i class="icon icon-chat-host"></i>');
												fromClass += ' has-staff';
											} else if (sender.get('role') === User.MANAGER) {
												$from.append('<i class="icon icon-chat-manager"></i>');
												fromClass += ' has-staff';
											} else if (sender.get('role') === User.BOUNCER) {
												$from.append('<i class="icon icon-chat-bouncer"></i>');
												fromClass += ' has-staff';
											} else if (sender.get('role') === User.DJ) {
												$from.append('<i class="icon icon-chat-dj"></i>');
												fromClass += ' has-staff';
											}

											fromClass += ' promoter';
											$from.append('<i class="icon icon-chat-promoter"></i>');
										} else if (sender.hasPermission(User.BOUNCER)) {
											fromClass += ' staff';

											if (sender.hasPermission(User.COHOST)) {
												$from.append('<i class="icon icon-chat-host"></i>');
											} else if (sender.get('role') === User.MANAGER) {
												$from.append('<i class="icon icon-chat-manager"></i>');
											} else if (sender.get('role') === User.BOUNCER) {
												$from.append('<i class="icon icon-chat-bouncer"></i>');
											}
										} else if (sender.get('role') === User.DJ) {
											fromClass += ' dj';
											$from.append('<i class="icon icon-chat-dj"></i>');
										} else if (eventData.uid === currentUser.get('id')) {
											fromClass += ' you';
										} else if (sender.get('sub') > 0) {
											fromClass += ' subscriber';
										} else if (sender.get('silver')) {
											fromClass += ' silver-subscriber';
										}
									}

									fromClass += ' id-' + sender.get('id');
								}
							}

							clickable = true;
						} else if ('moderation' === eventData.type) {
							sender = users.get(eventData.mi);

							if (sender) {
								if (sender.hasPermission(User.ADMIN, true)) {
									fromClass += ' admin';
								} else if (sender.hasPermission(User.AMBASSADOR, true)) {
									fromClass += ' ambassador';
								} else if (sender.hasPermission(User.SITEMOD, true)) {
									fromClass += ' sitemod';
								} else if (sender.hasPermission(User.PLOT, true)) {
									fromClass += ' plot';
								} else if (sender.hasPermission(User.PROMOTER, true)) {
									fromClass += ' promoter';
								} else {
									fromClass += ' staff';
								}
							} else {
								fromClass += ' staff';
							}

							$badgeBox.append(window.$('<i/>').addClass('icon icon-' + eventData.icon));
						} else if (!('user-action' !== eventData.type && 'promo' !== eventData.type)) {
							sender = users.get(eventData.i);

							if (sender) {
								if (sender.hasPermission(User.HOST, true)) {
									fromClass += ' admin';
								} else if (sender.hasPermission(User.AMBSSADOR, true)) {
									fromClass += ' ambassador';
								} else if (sender.hasPermission(User.SITEMOD, true)) {
									fromClass += ' sitemod';
								} else if (sender.hasPermission(User.PLOT, true)) {
									fromClass += ' plot';
								} else if (sender.hasPermission(User.PROMOTER, true)) {
									fromClass += ' promoter';
								} else if (eventData.i === currentUser.get('id')) {
									fromClass += ' you';
								}
							}

							if ('gift' === eventData.icon) {
								fromClass += ' gift';
							}

							$badgeBox.append(window.$('<i/>').addClass('icon icon-' + eventData.icon));
						}

						if (!merged) {
							$from.addClass(fromClass);

							var $username = window.$('<span/>').addClass('un').text(eventData.un);

							$from.append($username);

							if (clickable) {
								$badgeBox.addClass('clickable').data('uid', eventData.uid).on('click', this.fromClickBind);
								$username.addClass('clickable').on('click', this.fromClickBind);
							}

							if (eventData.uid && eventData.cid) {
								if (canModChat) {
									$element.addClass('deletable').on('mouseenter', this.chatOverBind).on('mouseleave', this.chatOutBind)
										.append(window.$('<div/>').addClass('delete-button').on('click', this.chatDeleteClickBind).text(Lang.chat.delete));
								}

								$element.attr('data-cid', eventData.cid);
							}

							$message.append($from);
						}

						$timestamp = window.$('<span/>').addClass('timestamp').text(eventData.timestamp);
					} else if ('system' === eventData.type) {
						$badgeBox = window.$('<div/>').addClass('badge-box').append('<i class="icon icon-plug-dj"></i>');
						$from.append(window.$('<span/>').addClass('un').text(Lang.alerts.systemAlert));
						$timestamp = window.$('<span/>').addClass('timestamp').text(eventData.timestamp);
						$message.append($from.addClass('from'));
					}

					if (!merged) {
						$message.append((this.lastText = window.$('<div/>').addClass('text').addClass('cid-' + eventData.cid).html(eventData.message)));

						if (eventData.cid) {
							$message.addClass('cid-' + eventData.cid);
						}

						if ($badgeBox) {
							$element.append($badgeBox);
						}

						$element.append($message);
					}

					if ($timestamp) {
						this.lastText.append($timestamp);

						if (settings.settings.chatTimestamps) {
							$timestamp.show();
						}
					}

					var Media = [];
					var that = this;

					var proxyUrl = '';

					var loadNextImage = function Util() {
						if (Media.length) {
							var image = new Image();

							image.onload = function Event(event) {
								var source = event.target.src.replace(proxyUrl, '');

								if (_$[source] && _$[source].length) {
									var loadingClass = _$[source].shift();
									var $loadingGif = window.window.$('.iph-' + loadingClass);

									if ($loadingGif.hasClass('break-before')) {
										$loadingGif.before(window.$('<br/>'));
									}

									if ($loadingGif.hasClass('break-after')) {
										$loadingGif.after(window.$('<br/>'));
									}

									var $image = window.$(event.target).addClass('cimg');
									var $link = window.$('<a href="' + source + '" target="_blank"/>');

									$link.append($image);
									$loadingGif.before($link).remove();

									if (!_$[source].length) {
										_$[source] = void 0;
										delete _$[source];
									}

									that.checkScroll();
								}

								if (Media.length) {
									_.delay(loadNextImage, 100);
								}
							};

							image.onerror = function Event(event) {
								var source = event.target.src.replace(proxyUrl, '');

								var loadingClass = _$[source].shift();

								window.window.$('.iph-' + loadingClass).remove();

								if (!_$[source].length) {
									_$[source] = void 0;
									delete _$[source];
								}

								if (Media.length) {
									_.delay(loadNextImage, 100);
								}
							};

							image.src = proxyUrl + Media.shift();
						}
					};

					if (eventData.images) {
						if (!Media.length) {
							_.delay(loadNextImage, 50);
						}

						for (var i in eventData.images) {
							if (!_$[eventData.images[i]]) {
								_$[eventData.images[i]] = [];
							}

							_$[eventData.images[i]].push(i);
							Media.push(eventData.images[i]);
						}
					}

					if (eventData.jumbomoji) {
						this.lastText.addClass('jumbomoji');
					}

					var $;

					if (merged) {
						$ = this.$chatMessages.scrollTop() >= this.$chatMessages[0].scrollHeight - this.$chatMessages.height() - this.lastText.height();
					} else {
						$ = this.$chatMessages.scrollTop() > this.$chatMessages[0].scrollHeight - this.$chatMessages.height() - 20;

						this.$chatMessages.append($element);

						if (this.$chatMessages.children().size() > 1024) {
							this.$chatMessages.children().first().remove();
						}
					}

					if ($) {
						this.$chatMessages.scrollTop(this.$chatMessages[0].scrollHeight);
					}

					if (eventData.sound && this.$chatInputField) {
						if (this.$el.is(':visible') && !this._popout) {
							if (!this.$chatInputField.is(':focus')) {
								this.playSound();
							}
						} else if (this._popout) {
							if (!this.$chatInputField.is(':focus')) {
								this.playSound();
							}
						}
					}
				} catch (e) {
					console.error(e);
				}
			};

			Events._events['chat:receive'][1].callback = chatView.prototype.onReceived;
		}
	}

	check();
})();