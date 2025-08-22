;(function(window, angular) {

  'use strict';

  // Application module
  angular.module('app', [
    'ui.router',
    'app.common',
    'app.message'
  ])

  /* Application config */
  .config([
    '$stateProvider', 
    '$urlRouterProvider',
    '$locationProvider',   
    function($stateProvider, $urlRouterProvider,$locationProvider) {

      $stateProvider
      .state('root', {
        views: {
          '': {
            templateUrl: './html/root.html',
            controller: 'languageController'
          },
          'header@root': {
            templateUrl: './html/header.html',
            controller: 'headerController'
          },
          'footer@root': {
            templateUrl: './html/footer.html',
            controller: 'footerController'
          },
          'modal@root': {
            template: `<ng-message audio-url="'./media/audio/error.mp3'">
                       </ng-message>`
          }
        }
      })
			.state('home', {
				url: '/',
        parent: 'root',
				templateUrl: './html/home.html',
        controller: 'homeController'
			})
      .state('our_projects', {
				url: '/our_projects',
        parent: 'root',
				templateUrl: './html/projects.html',
        controller: 'our_projectsController'
			})
      .state('aboutUs', {
				url: '/aboutUs',
        parent: 'root',
				templateUrl: './html/aboutUs.html',
        controller: 'aboutUs_Controller'
			})
      .state('contact', {
				url: '/contact',
        parent: 'root',
				templateUrl: './html/contact.html'
			});
      $urlRouterProvider.otherwise('/');

      // Hashtag nélküli URL
      $locationProvider.html5Mode({
        enabled: true,
        requireBase: true,
        rewriteLinks: true
      });
    }
  ])

  // Application run
  .run([
    'trans',
    function(trans) {

      // Transaction events
      trans.events();
    }
  ])

  .directive('slidingCapsule', [
    '$timeout', '$rootScope', '$injector',
    function($timeout, $rootScope, $injector){
      return {
        restrict: 'A',
        link: function(scope, el){
          const nav = el[0];
          const cap = nav.querySelector('.nav-capsule');
          if (!cap) return;

          function getActiveLink(){
            return nav.querySelector('.nav-link.active-capsule') ||
                  nav.querySelector('.nav-link');
          }

          function measure(){
            $timeout(function(){
              const a = getActiveLink();
              if (!a) return;

              const aRect = a.getBoundingClientRect();
              const nRect = nav.getBoundingClientRect();

              const padX = 12;     // „pufi” szélesség
              const padY = 8;      // „pufi” magasság
              const left   = (aRect.left - nRect.left) - padX/2 + nav.scrollLeft;
              const top    = a.offsetTop - 4;
              const width  = aRect.width  + padX;
              const height = aRect.height + padY;

              cap.style.width  = width + 'px';
              cap.style.height = height + 'px';
              cap.style.transform = `translateX(${left}px)`;
              cap.style.top = top + 'px';
              cap.style.opacity = '1';
            }, 0);
          }

          function schedule(){
            $timeout(measure, 0);
            $timeout(measure, 120);
            $timeout(measure, 300);
          }

          // első betöltés
          schedule();

          // ui-router: onSuccess (ha van), különben $stateChangeSuccess
          let deregisters = [];
          try {
            const $transitions = $injector.get('$transitions');
            deregisters.push($transitions.onSuccess({}, () => schedule()));
          } catch(e){
            deregisters.push($rootScope.$on('$stateChangeSuccess', () => schedule()));
          }

          // nyelvváltás
          const offLang = $rootScope.$on('languageLoaded', () => {
            $timeout(measure, 0);
            $timeout(measure, 120);
          });
          deregisters.push(offLang);

          // menülink kattintás
          nav.addEventListener('click', (e)=>{
            if (e.target.closest('.nav-link')) $timeout(measure, 50);
          });

          // logóra kattintás (brand)
          const brand = document.querySelector('.navbar .navbar-brand');
          if (brand){
            brand.addEventListener('click', () => $timeout(measure, 80));
          }

          // navbar collapse nyit/zár
          const onShown  = () => schedule();
          const onHidden = () => schedule();
          document.addEventListener('shown.bs.collapse', onShown);
          document.addEventListener('hidden.bs.collapse', onHidden);

          // ablakméret + fontbetöltés
          const onResize = () => measure();
          window.addEventListener('resize', onResize);
          if (document.fonts && document.fonts.ready){
            document.fonts.ready.then(()=> $timeout(measure, 0));
          }

          // takarítás
          scope.$on('$destroy', ()=>{
            deregisters.forEach(fn => { try{ fn(); }catch(_){} });
            window.removeEventListener('resize', onResize);
            document.removeEventListener('shown.bs.collapse', onShown);
            document.removeEventListener('hidden.bs.collapse', onHidden);
            if (brand) brand.removeEventListener('click', () => $timeout(measure, 80));
          });
        }
      };
    }
  ])

  //----------Language_controller------------->
  .controller('languageController', [
    '$scope', 
    '$rootScope',
    
    function($scope, $rootScope) {
  
      // Set local methods
      let methods = {
  
        // Initialize
        init: () => {
  
          // Get available languages
          fetch('./lang/available.json')
            .then(response => response.json())
            .then(response => {
  
              // Set language in rootScope
              $rootScope.lang = {
                available: response
              };
  
              // Get last language identifier from localStorage or default to 'hu'
              let langID = localStorage.getItem('languageID') || 'hu';
  
              // Set HTML lang attribute
              document.documentElement.lang = langID;
  
              // Set selected language identifier in rootScope
              $rootScope.lang.id = langID;
  
              // Get actual language index
              $rootScope.lang.index = methods.indexByKeyValue(
                $rootScope.lang.available, 'id', $rootScope.lang.id
              );
  
              // Get the selected language's data
              methods.getLanguage().then(() => {
                // Change the HTML title to the loaded language's title
                document.title = methods.capitalizeSentences($rootScope.lang.data.page_title);
  
                // Broadcast the event that the language has loaded
                $rootScope.$broadcast('languageLoaded');
              });
            })
            .catch(error => console.log(error));
        },
  
        // Get language and store in $rootScope
        getLanguage: () => {
          return fetch(`./lang/${$rootScope.lang.id}.json`)
            .then(response => response.json())
            .then(response => {
  
              // Capitalize sentences in all string fields
              for (let key in response) {
                if (typeof response[key] === 'string') {
                  response[key] = methods.capitalizeSentences(response[key]);
                }
              }
  
              // Store all language data globally in $rootScope
              $rootScope.lang.data = response;
  
              // Optionally set specific sections globally (e.g., home_cards)
              $rootScope.home_cards = $rootScope.lang.data.home_cards;
  
              $scope.$applyAsync();
            })
            .catch(error => console.log(error));
        },
  
        // Index array of object key value
        indexByKeyValue: (a, k, v) => a.findIndex(o => o[k] === v),
  
        // Capitalize first letter of string
        capitalize: (s) => s[0].toUpperCase() + s.slice(1),
  
        // Capitalize the first letter after sentence-ending punctuation
        capitalizeSentences: (text) => {
          return text.replace(/(?:^|[.!?]\s+)([a-z])/g, (match, firstLetter) => {
            return match.replace(firstLetter, firstLetter.toUpperCase());
          });
        }
      };
  
      // Set scope methods
      $scope.methods = {
  
        // Language change handler
        languageChanged: (langID) => {
  
          // Set selected language identifier
          $rootScope.lang.id = langID;
  
          // Save selected language identifier to local storage
          localStorage.setItem('languageID', langID);
  
          // Change HTML lang attribute value
          document.documentElement.lang = langID;
  
          // Get selected language index
          $rootScope.lang.index = methods.indexByKeyValue(
            $rootScope.lang.available, 'id', $rootScope.lang.id
          );
  
          // Get the newly selected language and update content
          methods.getLanguage().then(() => {
            // Update HTML title
            document.title = methods.capitalizeSentences($rootScope.lang.data.page_title);
  
            // Broadcast the event that the language has been updated
            $rootScope.$broadcast('languageLoaded');
          });
        }
      };
  
      // Initialize the language controller
      methods.init();
    }
  ])

  //------------aboutUs_Controller------------->
  .controller('aboutUs_Controller', [
    '$scope','http','$timeout',
    function($scope, http, $timeout) {

      // KÉPTÖMBÖK
      $scope.workshopImages = [];   // műhely
      $scope.machineImages  = [];   // gépek

      // induló slide indexek (ha kell)
      $scope.workshopStart = 0;
      $scope.machinesStart = 0;

      // Segéd: bootstrap Carousel indító
      function initCarouselById(id, startIndex){
        $timeout(function(){
          var el = document.getElementById(id);
          if (!el || !window.bootstrap || !bootstrap.Carousel) return;
          var inst = bootstrap.Carousel.getInstance(el) || new bootstrap.Carousel(el, {
            interval: 3000,
            pause: false,
            wrap: true,
            touch: true
          });
          inst.to(startIndex || 0);
          inst.cycle();
        }, 0);
      }

      // 1) MŰHELY képek
      http.request('./php/our_company.php')
        .then(function(response){
          var arr = (response && response.gallery) ? response.gallery : [];
          $scope.workshopImages = arr.map(function(name, i){
            return {
              src: 'media/image/our_industry/' + name,
              alt: 'Műhely kép ' + (i+1)
            };
          });
          $scope.$evalAsync(function(){
            initCarouselById('aboutWorkshop', $scope.workshopStart);
          });
        })
        .catch(console.error);

      // 2) GÉPEK képek
      http.request('./php/our_machines.php')
        .then(function(response){
          var arr = (response && response.gallery) ? response.gallery : [];
          $scope.machineImages = arr.map(function(name, i){
            return {
              src: 'media/image/our_machines/' + name,
              alt: 'Gép ' + (i+1)
            };
          });
          $scope.$evalAsync(function(){
            initCarouselById('machinesCarousel', $scope.machinesStart);
          });
        })
        .catch(console.error);
    }
  ])

  //------------Header_controller------------->
  .controller('headerController', [
    '$scope', '$state', '$timeout', '$window',
    function($scope, $state, $timeout, $window) {
      $scope.$state = $state;


      function closeNavbar(){
      var nav = document.getElementById('navbarSupportedContent');
      if (!nav) return;
      if (nav.classList.contains('show')) {
        // Bootstrap 5 Collapse API
        var inst = bootstrap.Collapse.getInstance(nav);
        if (!inst) inst = new bootstrap.Collapse(nav, { toggle: false });
        inst.hide();
      }
    }

    // állapotváltás után automatikus csukás
    $scope.$watch(() => $state.current && $state.current.name, function(){
      $timeout(closeNavbar, 0);
    });

      function updateCapsule(){
        // csak a MENÜ-s UL-ben dolgozunk (az első navbar-nav a collapse-en belül)
        var menuWrapper = document.querySelector('#navbarSupportedContent .position-relative');
        if (!menuWrapper) return;

        var ul   = menuWrapper.querySelector('ul.navbar-nav');
        var pill = menuWrapper.querySelector('.nav-capsule');
        if (!ul || !pill) return;

        var active = ul.querySelector('.nav-link.active-capsule');
        if (!active){
          pill.style.width='0px'; pill.style.height='0px';
          return;
        }

        var ulRect  = ul.getBoundingClientRect();
        var aRect   = active.getBoundingClientRect();
        var isDesktop = window.innerWidth >= 992;

        if (isDesktop){
          // vízszintes kapszula (desktop, sorba rendezett menü)
          var padX = 16;
          var left = Math.round(aRect.left - ulRect.left - padX/2);
          var width= Math.round(aRect.width + padX);
          var height = 40; // illeszd a nav magasságához, vagy: aRect.height

          pill.style.top    = (ulRect.height/2 - height/2) + 'px';
          pill.style.left   = left + 'px';
          pill.style.width  = width + 'px';
          pill.style.height = height + 'px';
        } else {
          // függőleges kapszula (mobil)
          var extraX = 4; // pici ráhagyás, hogy ne vágjon bele a betűkbe
          var top    = Math.round(aRect.top  - ulRect.top);
          var height = Math.round(aRect.height);
          var left   = Math.round(aRect.left - ulRect.left - extraX/2);
          var width  = Math.round(aRect.width + extraX);

          pill.style.top    = top + 'px';
          pill.style.left   = left + 'px';
          pill.style.width  = width + 'px';
          pill.style.height = height + 'px';
        }
      }

      // első render és minden váltás után
      $timeout(updateCapsule, 0);
      $scope.$watch(() => $state.current && $state.current.name, function(){
        $timeout(updateCapsule, 0);
      });

      // ablakméret + hamburger nyit/zár
      angular.element($window).on('resize', () => $timeout(updateCapsule, 100));
      var nav = document.getElementById('navbarSupportedContent');
      if (nav){
        nav.addEventListener('shown.bs.collapse', () => $timeout(updateCapsule, 0));
        nav.addEventListener('hidden.bs.collapse', () => $timeout(updateCapsule, 0));
      }

      // takarítás
      $scope.$on('$destroy', function(){
        angular.element($window).off('resize');
        if (nav){
          nav.removeEventListener('shown.bs.collapse', updateCapsule);
          nav.removeEventListener('hidden.bs.collapse', updateCapsule);
        }
      });
    }
  ])

  //------------Our_projects_controller------->
  .controller('our_projectsController', [
    '$scope', 
    '$rootScope', 
    '$q', 
    'http',
    function($scope, $rootScope, $q, http){

      $scope.worker_pic = './media/image/our_jobs/worker_2_01.jpg';

      // --- FIX alap: csak id + dir (a név mindig a lang-ból jön) ---
      const BASE_CATS = [
        { id:'kulteri-korlatok',          dir:'kulteri_korlatok' },
        { id:'acel-szerkezetek-feltetok', dir:'acel_szerkezetek_feltetok' },
        { id:'gokart-alvazak-ulesek',     dir:'gokart_alvazak_ulesek' },
        { id:'egyedi-megrendelesek',      dir:'egyedi_megrendelesek' },
        { id:'kerekpar-tarolok',          dir:'kerekpar_tarolok' }
      ];

      // helper: lokalizált kategórianév
      function tCatName(id){
        const key = 'cat_' + id;                   // pl. cat_kulteri-korlatok
        return ($rootScope.lang && $rootScope.lang.data && $rootScope.lang.data[key])
              || id; // fallback: az id, ha hiányzik bármiért
      }

      // a view-ben használt kategórialista (id, dir, name)
      function buildLocalizedCategories(){
        return BASE_CATS.map(c => ({ ...c, name: tCatName(c.id) }));
      }

      $scope.categories = buildLocalizedCategories();
      $scope.activeCat  = 'kulteri-korlatok';
      $scope.images     = [];

      // képek -> item-ek
      function mapFilesToItems(cat, basenames){
        return (basenames || []).map((name) => ({
          src   : `media/image/our_jobs/${cat.dir}/${name}`,
          cat   : cat.id
          // title-t nem írjuk be fixre; mindig imgTitle(img) generálja
        }));
      }

      // egy kategória betöltése
      function loadOne(cat){
        return http.request(`./php/gallery.php?dir=${cat.dir}`).then(basenames => {
          return mapFilesToItems(cat, basenames);
        });
      }

      // összes kategória betöltése
      function loadAll(){
        return $q.all($scope.categories.map(loadOne)).then(chunks => {
          $scope.images = [].concat(...chunks);
          $scope.$applyAsync();
        });
      }

      // pill váltás
      $scope.setCategory = function(id){
        $scope.activeCat = id;
        if (id === 'all'){
          loadAll();
        } else {
          const cat = $scope.categories.find(c => c.id === id);
          if (cat){
            loadOne(cat).then(rows => { $scope.images = rows; $scope.$applyAsync(); });
          }
        }
      };

      // ha a HTML-ben még bent van a | filter:byCategory, átengedünk mindent,
      // mert eleve szűrt képlistát töltünk
      $scope.byCategory = function(){ return true; };

      // képcím generátor – mindig a friss nyelvet használja
      $scope.imgTitle = function(img){
        // sorszám: helye a (jelenleg megjelenített) filtered tömbben a saját kategóriáján belül
        // (ha nincs filtered, számolhatunk images-ben is)
        const list = $scope.filtered && $scope.filtered.length ? $scope.filtered : $scope.images;
        const sameCat = list.filter(x => x.cat === img.cat);
        const idx = sameCat.indexOf(img);
        const n = (idx >= 0 ? idx + 1 : 1);

        return tCatName(img.cat) + ' #' + n;
      };

      // induláskor töltsük az első kategóriát
      $scope.setCategory($scope.activeCat);

      // --- Modal logika (változatlan) ---
      const modalEl = document.getElementById('galleryModal');
      let bsModal = null;
      function ensureModal(){
        if (modalEl && window.bootstrap && bootstrap.Modal){
          bsModal = bootstrap.Modal.getOrCreateInstance(modalEl, { keyboard:true });
        }
      }

      $scope.openModal = function(index, list){
        ensureModal();
        $scope.filtered = Array.isArray(list) ? list : $scope.images;
        $scope.currentIndex = index || 0;
        $scope.currentTotal = $scope.filtered.length;
        $scope.current = $scope.filtered[$scope.currentIndex];
        $scope.$applyAsync();
        bsModal && bsModal.show();
      };

      $scope.next = function(){
        if (!$scope.filtered || !$scope.filtered.length) return;
        $scope.currentIndex = ($scope.currentIndex + 1) % $scope.filtered.length;
        $scope.current = $scope.filtered[$scope.currentIndex];
      };

      $scope.prev = function(){
        if (!$scope.filtered || !$scope.filtered.length) return;
        $scope.currentIndex = ($scope.currentIndex - 1 + $scope.filtered.length) % $scope.filtered.length;
        $scope.current = $scope.filtered[$scope.currentIndex];
      };

      function onKey(e){
        if (!modalEl || !modalEl.classList.contains('show')) return;
        if (e.key === 'ArrowRight') { $scope.$apply($scope.next); }
        if (e.key === 'ArrowLeft')  { $scope.$apply($scope.prev); }
      }
      document.addEventListener('keydown', onKey);
      $scope.$on('$destroy', ()=> document.removeEventListener('keydown', onKey));

      // --- Nyelvváltás kezelése ---
      // 1) frissítsük a kategórianeveket
      // 2) ne töltsünk újra képeket feleslegesen; elég, ha a cím-generálás (imgTitle) lokalizált
      $rootScope.$on('languageLoaded', function(){
        $scope.categories = buildLocalizedCategories();
        // Ha szeretnéd újraszámolni/újracímkézni a már bent lévő képeket:
        // Nincs teendő: imgTitle() mindig friss nyelvre épít.
        $scope.$applyAsync();
      });
    }
  ])

  //------------Footer_controller------------->
  .controller('footerController', [
  '$scope',
  '$rootScope',
  '$sce',
    function($scope, $rootScope,$sce) {

      // Nyelvi adatok frissítése
      $rootScope.$on('languageLoaded', function () {
        $scope.lang = $rootScope.lang.data;
      });

      $scope.encodeAddress = function (s) {
        return encodeURIComponent(s || '');
      };


      // Google Maps embed URL – szépen tördelve
      let mapUrl = [
        'https://www.google.com/maps/embed?pb=',
        '!1m18!1m12!1m3!1d2759.780888623204',
        '!2d20.4863575759799!3d46.2347018817014',
        '!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1',
        '!3m3!1m2!1s0x474459d845928fbb%3A0x7b4ff9f26a420e40!2sKLtechnik%20Kft.',
        '!5e0!3m2!1shu!2shu!4v1754846281249!5m2!1shu!2shu'
      ].join('');

      // Iframe-hez trusted URL kell
      $scope.mapSrc = $sce.trustAsResourceUrl(mapUrl);

    }
  ])

  //------------Home_controller--------------->
  .controller('homeController', [
  '$scope', '$timeout', 'http',
  function ($scope, $timeout, http) {


        // --- itt a legelején takarítunk ---
      (function cleanupGlobalFlags() {
        const targets = [document.body, document.documentElement,
                        document.querySelector('#app'), 
                        document.querySelector('.page'),
                        document.querySelector('.hero-left')].filter(Boolean);
        const bad = ['noTransform','noAnimation','animPaused','noTransition'];
        targets.forEach(t => bad.forEach(c => t.classList.remove(c)));
      })();


    $scope.heroImages = [];
    $scope.heroStart  = 0; // indulhat 0-ról, a PHP már keveri a sorrendet

    // --- Bootstrap carousel init, csak ha már van DOM + item ---
    function initCarousel(retries){
      $timeout(function(){
        var el = document.getElementById('heroCarousel');
        if (!el) {
          if ((retries||0) > 0) return initCarousel(retries-1);
          return;
        }
        var items = el.querySelectorAll('.carousel-item');
        if (!items || items.length === 0) {
          if ((retries||0) > 0) return initCarousel(retries-1);
          return;
        }

        if (window.bootstrap && bootstrap.Carousel) {
          var inst = bootstrap.Carousel.getInstance(el);
          if (!inst) {
            inst = new bootstrap.Carousel(el, {
              interval: 3500,
              pause: false,
              wrap: true,
              touch: true
            });
          }
          inst.to($scope.heroStart || 0); // ugorjunk a kezdő diára
          inst.cycle();                   // és kezdje el pörgetni
        }
      }, 0);
    }

    // --- Képek betöltése a backendre támaszkodva (PHP kever) ---
    http.request('./php/main-carousel.php')
      .then(function (response) {
        var arr = (response && response.gallery) ? response.gallery : [];
        $scope.heroImages = arr.map(function(name, i){
          return {
            src: 'media/image/main_carousel/' + name,
            alt: 'Hero kép ' + (i+1)
          };
        });

        // Várjuk meg, míg az ng-repeat DOM-ot rajzol, aztán indítunk
        $scope.$evalAsync(function(){
          initCarousel(10); // max 10 próbálkozás
        });
      })
      .catch(function (e) {
        console.error(e);
      });


    // --- ÚJRATÖLTÉS, ha home state-re váltunk ---
    $scope.$on('$stateChangeSuccess', function(event, toState) {
      if (toState.name === "home") {
        setTimeout(function() {
          window.location.reload();
        }, 50);
      }
    });

  }
]);
})(window, angular);