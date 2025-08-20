;(function(window, angular) {

  'use strict';

  // Application message module
  angular.module('app.message', [
    'app.common'
  ])

	// Message factory
  .factory('msg', [
    '$rootScope',
    'util',
    ($rootScope, util) => {

			// Define message dielog element
			let msgDialog;

			// Set local methods
      let methods = {

				// Initialize
				init: (options) => {

					// Merge options with message defaults
					return 	util.objMerge({
										icon 			: null,
										title     : null,		
										content 	: '',
										isAudio 	: true,
										isConfirm	: false,
										callback	: null
									}, options, true);
				},

				// Play sound
				play: (isAudio) => {
					if (isAudio) {
						let audioElement = msgDialog.querySelector('audio');
						if (audioElement) {
							audioElement.volume = 0.1;
							audioElement.play();
						}
					}
				},

				// Show dialog
				show: (options) => {
					
					// Set message, and apply change
					$rootScope.message = options;
					$rootScope.$applyAsync();

					// Show dialog
					(new bootstrap.Modal(msgDialog)).show();
				},

				// Events
				events: () => {

					// Set event on message dialog close
					msgDialog.addEventListener('msgDialogClose', methods.reset);
				},

				// Reset
				reset: (customEvent) => {

					// Remove event on modal close
					msgDialog.removeEventListener('msgDialogClose', methods.reset);
					
					// Check callback function exist
					if (util.isFunction($rootScope.message.callback)) {

						// Execute callback function
						$rootScope.message.callback(customEvent.detail);
					}

					// Reset rootscope message property
					$rootScope.message = undefined;
				}
      };

			// Set message
			let msg = {

				// Show
				show: (options) => {

					// Get/Check message dialog element
					msgDialog = document.querySelector('#msg-dialog');
          if (msgDialog) {

						// Initialize
						options = methods.init(options);
            
						// Play sound
						methods.play(options.isAudio);

						// Show dialog
						methods.show(options);

						// Set events
						methods.events();
          }
				},

				// Error
				error: (content) => {
					msg.show({
            icon    : "text-danger fa-solid fa-circle-exclamation",
            content : content
          });
				}
			};

			// Return message
      return msg;
		}
	])

	// Message directive
  .directive('ngMessage', [
    () => {

			// Controller
			let msgController = [
				'$scope',
				'$element',
				($scope, $element) => {

					// Set scope methods
					$scope.methods = {

						// Button clicked
						clicked: (btnId) => {

							// Create new custom event
							let customEvent = new CustomEvent("msgDialogClose", {
								detail: btnId
							});

							// Get/Check message dialog, and trigger event
							let msgDialog = $element[0].querySelector('#msg-dialog');
							if (msgDialog) msgDialog.dispatchEvent(customEvent);
						}
					}
				}
			];

      return {
				restrict: 'EA',
				replace: true,
				scope: {
					audioUrl: "<"
				},
				controller: msgController,
				template:`<div class="msg-container">
										<div id="msg-dialog" 
												class="modal fade" 
												data-bs-backdrop="static" 
												data-bs-keyboard="false"
												aria-modal="true" 
												tabindex="-1"
												ng-bs-hide-modal>
											<div class="modal-dialog border border-3 rounded-3
																	border-secondary shadow-bottom-end">
												<div class="modal-content text-dark">
													<div class="modal-header">
														<i class="fa-3x" ng-class="$root.message.icon"></i>
														<h3 class="ms-3 text-capitalize text-small-caps">
															{{$root.message.title}}
														</h3>
													</div>
													<div class="modal-body py-4 px-2">
														<h5 class="text-center">
															<span>{{$root.message.content}}</span>
														</h5>
													</div>
													<div class="modal-footer">
														<button type="button"
																		class="btn btn-primary px-4"  
																		data-bs-dismiss="modal"
																		ng-click="methods.clicked('ok')">
															Ok
														</button>
														<button type="button"
																		class="btn btn-secondary px-4"  
																		data-bs-dismiss="modal"
																		ng-if="$root.message.isConfirm"
																		ng-click="methods.clicked('cancel')">
															Mégsem
														</button>
													</div>
												</div>
												<audio controls="false" class="d-none m-0 p-0"
															 ng-if="audioUrl">
													<source ng-src="{{audioUrl}}" type="audio/mpeg">
												</audio>
											</div>
										</div>
									</div>`
			};
		}
	]);

})(window, angular);