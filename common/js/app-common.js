;(function(window, angular) {

	'use strict';

  // Add class(es)
  HTMLElement.prototype.addClass = (function(classList) {
    let element = this; 
    if (Object.prototype.toString.call(classList) === '[object String]') {
      classList = [...new Set(classList.split(' ').map(s => s.trim()).filter(s => s.length))];
      classList.forEach(c => element.classList.add(c));
    }
  });

  // Remove class(es)
  HTMLElement.prototype.removeClass = (function(classList) {
    let element = this;  
    if (Object.prototype.toString.call(classList) === '[object String]') {
      classList = [...new Set(classList.split(' ').map(s => s.trim()).filter(s => s.length))];
      classList.forEach(c => element.classList.remove(c));
    }
  });

  // Toogle class(es)
  HTMLElement.prototype.toggleClass = (function(classList) {
    let element = this; 
    if (Object.prototype.toString.call(classList) === '[object String]') {
      classList = [...new Set(classList.split(' ').map(s => s.trim()).filter(s => s.length))];
      classList.forEach(c => element.classList.toggle(c));
    }
  });

	// Sort array randomly
  Array.prototype.random = () => this.sort((a, b) => Math.random() - 0.5);
  
  // Unique array
  Array.prototype.unique = (key=null) => {
    let arr = this;
    if (Object.prototype.toString.call(key) === '[object String]')
          return [...new Map(arr.filter(obj => key in obj).map(obj => 
                 [obj[key], obj])).values()];
    else 	return [...new Set(arr)];
  };

  // Convert day to string format (YYYY-mm-dd)
  Date.prototype.toISOFormat = () => this.toISOString().split('T')[0];

  // Application common module
  angular.module('app.common', [])

  // Current year (+-)
  .filter('currentYear', [
    function () {
      return (n) => {
        let offset = parseInt(n, 10);
        if (isNaN(offset)) offset = 0;
        return new Date().getFullYear() + offset;
      };
    }
  ])

	// Convert day to string format (YYYY-mm-dd)
	.filter('dateToStr', [
    () => {
      return (date) => {
        return date ? date.toISOFormat() : date;
      };
    }
  ])


  // Add to number pixel property
  .filter('pixel', [
    'util',
    (util) => {
      return (number) => {
        if (!util.isVarNumber(number)) return;
        return number + 'px';
      };
    }
  ])

  // Number leading zero
  .filter('numPad', [
    'util',
    (util) => {
      return (number, len) => {
      
		  	// Check parameters
		  	if (!util.isNumber(number)) return;
        if (!util.isNumber(len) || len < 2) len = 2;
        return ('0'.repeat(len) + number.toString()).slice (-1 * len);
      };
    }
  ])

  // Number thousand separator
  .filter('numSep', [
    'util',
    (util) => {
      return (number, separator) => 
        util.mumberToStringThousandSeparator(number, separator)
    }
  ])

  // Trusted external resource url
  .filter('trustAsResourceUrl', [
		'$sce', 
		($sce) => {
    	return (val) => $sce.trustAsResourceUrl(val)
		}
	])

	// Utilities factory
  .factory('util', [
    '$q',
    '$interval',
    ($q, $interval) => {

      // Set utilities
      let util = {
				getType: checkedVar => Object.prototype.toString.call(checkedVar)
                                               .slice(8, -1).toLowerCase(),
				isUndefined: checkedVar =>  util.getType(checkedVar) === 'undefined',
    		isNull: checkedVar => util.getType(checkedVar) === 'null',
    		isBoolean: checkedVar => 	util.getType(checkedVar) === 'boolean',
    		isNumber: checkedVar =>	util.getType(checkedVar) === 'number',
    		isInt: checkedVar => util.isNumber(checkedVar) && checkedVar % 1 === 0,
    		isFloat: checkedVar => util.isNumber(checkedVar) && checkedVar % 1 !== 0,
    		isVarNumber: checkedVar => util.isNumber(checkedVar) ||
    		                          (util.isString(checkedVar) && 
                                  !isNaN(Number(checkedVar))),
    		isString: checkedVar => 	util.getType(checkedVar) === 'string',
    		isDate: checkedVar =>	util.getType(checkedVar) === 'date',
    		isArray: checkedVar =>	util.getType(checkedVar) === 'array',
    		isObject: checkedVar =>	util.getType(checkedVar) === 'object',
        isFunction: checkedVar =>	util.getType(checkedVar) === 'function',
        isNodeElement: checkedVar =>	checkedVar instanceof Element || 
  			                              checkedVar instanceof HTMLElement,
				cloneVariable: variable => {
					if (!util.isUndefined(variable)) {
							if (util.isDate(variable)) 
											return new Date(JSON.parse(JSON.stringify(variable)));
							else    return JSON.parse(JSON.stringify(variable));
					} else      return undefined;
				},
				hasKey: (checkedVar, key) => util.isString(key) && key in checkedVar,
				isObjectHasKey: (checkedVar, key) =>  util.isObject(checkedVar) && 
                                              util.hasKey(checkedVar, key),
        isFile: checkedVar =>	util.getType(checkedVar) === 'file',
				isJson: checkedVar => {
					if (util.isString(checkedVar)) {
							try       {return !util.isUndefined(JSON.parse(checkedVar));} 
							catch (e) {return false;}	
					} else return false;
				},
        indexByKeyValue: (a, k, v) => a.findIndex(o => o[k] === v),
				objFilterByKeys: (obj, filter, isExist=true, isSortKeys=false) => {
					if (!util.isObject(obj)) return obj;
					if (util.isString(filter)) {
						filter = filter.replaceAll(';', ',');
						filter = filter.split(",");
					}
					if (!util.isArray(filter) || !filter.length)
						return Object.assign({}, obj);
					if (!util.isBoolean(isExist)) isExist = true;
					if (!util.isBoolean(isSortKeys)) isSortKeys = false;
					let keys = Object.keys(obj);
					if (isSortKeys) keys.sort();
					return  Object.assign({}, 
									keys
									.filter((k) => {
										if (isExist) 
													return filter.includes(k);
										else  return !filter.includes(k); 
									}).reduce((o, k) => Object.assign(o, {[k]: obj[k]}), {}));
				},
				objMerge: (target, source, existKeys) => {
					if (!util.isObject(target)) target = {};
					if (!util.isObject(source)) source = {};
					if (util.isBoolean(existKeys) && existKeys)
									return  Object.assign({}, target, util.objFilterByKeys(source, Object.keys(target)));
					else    return  Object.assign({}, target, source);
				},
        objDifference: (a, b) => 
          Object.fromEntries(Object.entries(b)
                .filter(([key, val]) => key in a && a[key] !== val)),
				capitalize: (str, isLowerEnd=true) => {
          if (!util.isString(str) ||
              !(str = str.trim()).length) return str;
          if (str.length === 1) return str.toUpperCase();
          if (!util.isBoolean(isLowerEnd)) isLowerEnd = true;
          return  str.charAt(0).toUpperCase() + (isLowerEnd ?
                  str.substr(1).toLowerCase() : str.substr(1));
        },
				randomNumber: (min, max, step) => {
          min		= util.isInt(min) 	&& min >= 0	 ? min : 0;
          max		= util.isInt(max) 	&& max > min ? max : min+1;
          step	= util.isInt(step)	&& step > 0 && step <= max-min ? step : 1;
          return min + (step * Math.floor(Math.random() * (max-min+1) / step));
        },
        isJQuery: () => typeof jQuery !== 'undefined',
				base64ToUrl: (type, data) => `data:${type};base64,${data}`,
        base64Tofile: (type, data, name) => {
          return new Promise((resolve, reject) => {
            fetch(util.base64ToUrl(type, data))
            .then(response => response.blob())
            .then(result => {
              if (!util.isString(name)) name = '';
              resolve(new File([result], name, {type: type}));
            });
          });
        },
				getBase64UrlData: (url) => {
          let data = '';
          if (util.isString(url)) {
            data = url.toString().replace(/^data:(.*,)?/, '');
            if ((data.length % 4) > 0) data += '='.repeat(4 - (data.length % 4));
          }
          return data;
        },
        deferredObj: () => {
          let defer = $q.defer();
          return {promise: defer, completed: defer.promise};
        },
				fileReader: (file, options) => {

          // Create promise
          return new Promise((resolve, reject) => {

            // Check file is valid
            if (util.isFile(file)) {

              // Check/Convert options
              if (util.isString(options))
                options = {method: options};

              // Merge options with default
              options = util.objMerge({
                method  : 'readAsText',
                limit   : null,
                unit    : 'KB'
              }, options, true);

              // Check options method
              if (!util.isString(options.method))
                options.method = 'readAsText';
              options.method = options.method.trim();
              if (![
                'readAsArrayBuffer','readAsBinaryString',
                'readAsDataURL','readAsText'
              ].includes(options.method))
                options.method = 'readAsText';

              // Check options size limit
              if (!util.isInt(options.limit) || options.limit <= 0)
                options.limit = null;

              // Set size
              let size = options.limit;

              // Check size limit exist
              if (size) {
            
                // Create variable units
                let units = ["Byte", "KB", "MB", "GB", "TB"];

                // Check parameter size unit
                if (!util.isString(options.unit)) options.unit = 'KB';
                options.unit = options.unit.trim();
                if (options.unit.length === 2)
                      options.unit = options.unit.toUpperCase();
                else  options.unit = util.capitalize(options.unit);
                if (!units.includes(options.unit)) options.unit = 'KB';
                let multiplier = units.indexOf(options.unit);

                // Convert size limit to byte
                if (multiplier) while(multiplier--) size *= 1024;
              }

              // Check size limit exist, or file size is less then size limit
              if (!size || file.size <= size) {

                // Create file reader, and convert file to base64
                let reader = new FileReader();
                reader.onload   = () => resolve(reader.result);
                reader.onerror  = () => reject(`File read error: ${file.name}!`);
                reader[options.method](file);

              } else  reject(`File size limited: ${parseInt(options.limit)} ${options.unit}!`);
            } else    reject('Invalid parameter: file!');
          });
        },
        fileAllowedTypes: (file, types=null) => {

          // Create promise
          return new Promise((resolve, reject) => {

            // Check file is valid
            if (util.isFile(file)) {

              // Check parameter allowed types
              if (util.isString(types)) {
                types = types.trim().toLowerCase();
                if (['*', '*.*'].includes(types))
                      types = null;
                else  types = types.replace('*','').split(',').filter(()=>true);
              }

              // Check allowed types exist
              if (util.isArray(types) && types.length) {
                let isAllowed = false, 
                    mimeType  = file.type.toLowerCase();
                for(let i=0; i<types.length; i++) {
                  if (mimeType.includes(types[i].trim())) {
                    isAllowed = true;
                    break;
                  }
                }
                if (isAllowed)
                      resolve();
                else  reject('Invalid file type!');
              } else  resolve();
            } else    reject('Invalid parameter: file!');
          });
        },
        getLocation: (key=null) => {
          if (!util.isString(key)) key = 'origin';
          key = key.toLowerCase().trim();
          if (!util.hasKey(window.location, key)) key = 'origin';
          return window.location[key];
        },
        getPageId: () => {
          let pageId = "";
          ['hostname','pathname'].forEach(key => {
            let prop = util.getLocation(key).toLowerCase();
            if (prop[0] === '/') prop = prop.slice(1);
            if (prop.slice(-1) === '/') prop = prop.slice(0, -1);
            pageId += (pageId.length ? '/' : '') + prop;
          });
          return pageId;
        },
        localStorage: (method, key, value=null) => {
          if (!util.isString(method) || 
              !(method = method.trim().toLowerCase()).length ||
              !['set','get','remove'].includes(method) ||
              (method === 'set' && util.isNull(value)) ||
              !util.isString(key) || 
              !(key = key.trim().toLowerCase()).length) return null;
          let result = null;
          key = util.getPageId() + `-${key}`;
          switch(method) {
            case 'set':
              localStorage.setItem(key, JSON.stringify(value));
              break;
            case 'get':
              result = localStorage.getItem(key);
              if (!util.isNull(result) && 
                   util.isJson(result)) 
                result = JSON.parse(result);
              break;
            case 'remove':
              localStorage.removeItem(key);
              break;
          }
          return result;
        },
        waitUntil: (callback, delay, maxWaitingTime) => {
          return new Promise((resolve, reject) => {
            if (!util.isFunction(callback))
              return reject('Callback function is required (waitUntil)!');
            else if (callback()) return resolve();
            if (!util.isInt(delay) || delay < 0) delay = 1;
            if (!util.isInt(maxWaitingTime) || maxWaitingTime < delay)
              maxWaitingTime = 5000;
            let startTime = new Date(),
                interval  = 
            $interval(() => {
              if (callback()) {
                $interval.cancel(interval);
                return resolve();
              } else if ((new Date()) - startTime > maxWaitingTime) {
                $interval.cancel(interval);
                return reject('Time overflow (waitUntil)!');
              }
            }, delay);
          });
        },
        intersectionObserverInit: (options, fnCallBack) => {

          // Check options
          if (util.isString(options)) options = {skeleton: options};

          // Set options
          options = util.objMerge({
            skeleton  : undefined,      // Skeleton element(s)
            root      : undefined,			// Bounding parent element
						rootMargin: undefined,	    // Offset (margin)
						threshold : undefined		    // Numbers between 0.0:1.0 (1-hall element visible)
          }, options, true);
          if (!util.isString(options.skeleton) ||
              !(options.skeleton = options.skeleton.trim()).length)
            return;

          // Check call back function exist
          if (!util.isFunction(fnCallBack)) fnCallBack = null;

					// Create new intersection observer
    		  let observer = new IntersectionObserver(entries => {

						// Each entries
    		    entries.forEach(entry => {

							// Check is in viewport
    		      if (entry.isIntersecting)
    		        		entry.target.classList.add('show');
    		      else 	entry.target.classList.remove('show');

              // When call back function exist, then execute
              if (fnCallBack) fnCallBack(entry.target, entry.isIntersecting);
    		    });
    		  }, options);

					// Get elements
          let elements = document.querySelectorAll(options.skeleton);
          if (elements.length) {
            elements.forEach(element => {
              observer.observe(element);
            });
          }
    		},
        mumberToStringThousandSeparator: (number, separator) => {
		  	  if (!util.isVarNumber(number)) number = 0;
		  	  if (!util.isString(separator)) separator = ' ';
          return number.toString()
		  	  						 .replace(/(\d)(?=(\d{3})+(?!\d))/g,
		  	  										'$1' + separator.charAt(0)); 
        }
			};

			// Return utilities
			return util;
		}
	])

  // Transaction events factory
  .factory('trans', [
    '$transitions',
    '$rootScope',
    '$timeout',
    '$state',
    'util',
    ($transitions, $rootScope, $timeout, $state, util) => {

      // Set local methods
      let methods = {

        // Initialize
        init: (options) => {

          // Check options
          if (util.isString(options)) 
            options = {default: options};
          if (util.isArray(options))
            options = {disabled: options};
          options = util.objMerge({
            default : 'home',
            disabled: null,  
          }, options, true);
          if (util.isString(options.disabled)) 
            options.disabled = options.disabled.split(';');
          if (!util.isArray(options.disabled)) 
            options.disabled = [];

          // Define state properties
          $rootScope.state = util.objMerge({
            id      : null,
            prev    : null,
            default : null,
            disabled: null,
          }, options, true);
          options = undefined;
        },

        // Set page container visibility, and class
        setPageContainer: (stateId, method) => {
          let element = document.querySelector('.page-container');
          if (element) element.classList[method](stateId);
        },

        // Scroll to top
        scrollToTop: () => {
          $timeout(() => {
            let element = document.querySelector('.page-container');
            if (element) {
              element.scrollTo({
                top: 0, 
                left: 0, 
                behavior: 'smooth'
              });
            }
          });
        }
      };

      // Set transaction
      let transaction = {

        // Events
        events: (options=null, callback=null) => {

          // Initialize
          methods.init(options);

          // On before transaction
          $transitions.onBefore({}, (transition) => {

            // Check is first time
            if (util.isNull($rootScope.state.id)) {
              if ($rootScope.state.disabled.includes(transition.to().name))
                return transition.router.stateService.target($rootScope.state.default);
            }

            // Check state is change
            if(!angular.equals(transition.to().name, transition.from().name)) {

              // Set page container visibility, and class
              methods.setPageContainer(transition.from().name, 'remove');

              // Set state properties
              $rootScope.state.prev = $rootScope.state.id;
              $rootScope.state.id   = transition.to().name;
            }
          });


          // On success transaction
          $transitions.onSuccess({}, () => {

            // Set page container visibility, and class
            methods.setPageContainer($rootScope.state.id, 'add');

            // Scroll to top
            methods.scrollToTop();

            // Check callback function exist
            if (util.isFunction(callback)) {

              // Execute callback function
              callback();
            }
          });
        },

        // Check prevent state exist, and not disabled
        // Go to checked state
        preventState: () => {
          if ($rootScope.state.disabled.includes($rootScope.state.id)) {
            if (!$rootScope.state.prev ||
                  $rootScope.state.disabled.includes($rootScope.state.prev))
                  $state.go($rootScope.state.default);
            else  $state.go($rootScope.state.prev);
          }
        }
      };

      // Return transaction
      return transaction;
    }
  ])

  // Http request factory
	.factory('http', [
    '$http',
		'util', 
    ($http, util) => {

      return {

        // Request
				request: (options, method) => {

					// Create promise
					return new Promise((resolve, reject) => {

            // Set methods
            let methods = {

              // Initialize
              init: () => {

                // Check options url property
                if (util.isString(options))  options = {url: options};
                if (!util.isObject(options) ||
                    !util.isObjectHasKey(options, 'url') ||
                    !util.isString(options.url) ||
                    !(options.url = options.url.trim()).length) {
                  reject('Missing url HTTP request!');
                  return;
                }

                // Check method property
                if (!util.isString(method)) method = 'ajax';
                method = method.trim().toLowerCase();
                if (!['ajax', 'fetch', 'http', 'xml'].includes(method)) method = 'ajax';
                if (method === 'ajax' && !util.isJQuery()) method = 'fetch';

                // Check options method
                if (util.isObjectHasKey(options, 'method')) {
                  if (!util.isString(options.method)) 
                        options.method = 'GET';
                  options.method.trim().toUpperCase();
                  if (!['GET','POST'].includes(options.method)) 
                        options.method = 'GET';
                } else  options.method = 'GET';

                // Check/Set options data
                if (util.isObjectHasKey(options, 'data')) {
                  
                  // Check has property
                  if (!util.isUndefined(options.data)) {

                    if (!util.isString(options.data))
                      options.data = JSON.stringify(options.data);

                    // Check method
                    if (method !== 'ajax')
                          options.method = 'POST';
                    else  options.data = {data: options.data};
                  }
                } else options.data = undefined;

                // Call request
                methods[method]();
              },

              // Ajax jQuery
              ajax: () => {
                $.ajax({
                  url     : options.url,
                  type    : options.method,	                	
                  data    : options.data,
                  success : response => methods.check(response),
                  error   : e => reject(e.statusText)
                });
              },

              // Fetch
              fetch: () => {

                // Separate url from options
                let url = options.url;
                delete options.url;

                // Replace the data key with body
                options.body = options.data;
                delete options.data;

                fetch(url, options)
                .then(response => {
                  if (response.status >= 200 && response.status < 300)
                        return response.text();
                  else  reject(response.statusText);
                })
                .then(response => {
                  if (!util.isUndefined(response))
                    methods.check(response);
                })
                .catch(e => reject(e));
              },

              // Http angular
              http: () => {
                $http({ 
                  url   : options.url, 
                  method: options.method,
                  data  : options.data
                })
                .then(response => {
                  if (response.status >= 200 && response.status < 300)
                        methods.check(response.data);
                  else  reject(response.statusText);
                })
                .catch(e => reject(e.statusText));
              },

              // XML Http
              xml: () => {
                let xhr = new XMLHttpRequest();
                xhr.open(options.method, options.url, true);
                xhr.onload = () => {
                  if (xhr.status >= 200 && xhr.status < 300)
                        methods.check(xhr.response);
                  else  reject(xhr.statusText);
                };
                xhr.onerror = () => reject(xhr.statusText);
                xhr.responseType = "text";
                xhr.send(options.data);
              },

              // Check response
              check: response => {
                if (util.isUndefined(response)) {
                  resolve(null);
                  return;
                }
                if (util.isString(response) &&
                    response.includes('error') &&
                    response.includes('</span>') &&
                    response.includes('</th>')) {
                  let regex = /<\/span>(.*?)<\/th>/,
                      match = response.match(regex);
                  if (match && match.length >= 1) {
                    match[1] = match[1].replace("<i>", "");
                    match[1] = match[1].replace("</i>", "");
                    response = {error: match[1].trim()};
                  }
                }
                if (util.isJson(response)) response = JSON.parse(response);
                if (util.isObjectHasKey(response, "error") && 
                   !util.isNull(response.error))
                        reject(response.error);
                else if (util.isObjectHasKey(response, "data")) {
                  if (util.isJson(response.data))
                        resolve(JSON.parse(response.data));
                  else  resolve(response.data);
                } else	resolve(response);
              }
            };

            // Initialize
            methods.init();
          });
        }
      };
    }
  ])

  // Bootstrap modal hide directive
  .directive('ngBsHideModal', [
    () => {
			return {
				restrict: 'EA',
				scope: {},
				controller: [
          '$element',
          ($element) => {
            $element[0].addEventListener('hide.bs.modal', () => {
              if (document.activeElement instanceof HTMLElement)
                  document.activeElement.blur();
            });
				  }
        ]
      };
		}
	])

  // Bootstrap carousel force start directive
  .directive('ngBsCarouselForceStart', [
    () => {
			return {
				restrict: 'EA',
				scope: {},
				controller: [
          '$element',
          '$timeout',
          ($element, $timeout) => {
            $timeout(() => {
              if (bootstrap)
                new bootstrap.Carousel($element[0]);
            }, 300);
				  }
        ]
      };
		}
	]);

})(window, angular);