$3N = {
  touch : navigator.userAgent.test(/AppleWebKit.+Mobile/),
  trackEvent : function(category, action, label, value){    
    if (typeof(pageTracker) == "object") pageTracker._trackEvent(category, action, label, value);
    else if(typeof(_gaq) == "object") _gaq.push(['_trackEvent', category, action, label, value]);

    if (console && console.log)
      console.log($A(arguments).join(", "));
  }
};

window.addEvent('domready', function() { $3N.dom_ready = true; });

window.onerror = function(msg, url, linenumber){   
	var handle_error = function(msg, url, linenumber) {
		$3N.trackEvent(
      "Error",
      msg,
      navigator.userAgent,
      linenumber
    );		
	};

	if ($3N.dom_ready) handle_error(msg, url, linenumber);
	else							 window.addEvent('domready', handle_error.bind(window, [msg, url, linenumber]));
};


var iPadGallery = new Class({
  Implements: [Events, Options],
  
  options : {
    getLargeSrc : function(img){
      return img.get('src');
    },
    getMediumSrc : function(img){
      return img.get('src');
    },
    showcaseImageClass : 'showcase-image',
    photosSelector : 'img',
    preload : true,
    touchEvent : 'tap'
  },
  
  current_index : 0,
  
  initialize: function(elem, ge, sce, options){
    this.setOptions(options);
    this.element          = document.id(elem);
    this.gallery_element  = document.id(ge);
    this.showcase_element = document.id(sce);
    this.showcase_image_wrapper = new Element('div').inject(this.showcase_element, 'top');
    this.showcase_image   = new Element('img', {
                              'class': this.options.showcaseImageClass
                            }).inject(this.showcase_image_wrapper);
    
    this.setPhotos();
    this.attach();
    
    return this;
  },
  
  setPhotos: function(photos){
    this.photos = photos || this.gallery_element.getElements(this.options.photosSelector);

    this.photos.each(function(photo, i){      
      this.fireEvent('photoAdded', photo);
      photo.addEvent(this.options.touchEvent, function(){
        this.fireEvent('photoTapped', [photo, i]);
        this.current_index = i;
        this.updateShowcaseImage();
      }.bind(this));      
    }, this);
    
    return this;
  },
  
  attach: function(){
    var thiz = this;
    
    this.showcase_image_wrapper
      .addEvent(this.options.touchEvent, this.showGallery.bind(this))
      .addEvent('swipe', function(info){
        if (info.direction === 'right')
          this.previous();
        else if (info.direction === 'left')
          this.next();
      }.bind(this));
    
      this.showcase_image.addEvent('load', this._isLoaded.bind(this));
    
    return this;
  },
  _isLoaded: function(){
    this.fireEvent('showcaseWillOpen', this);
    this.showcase_element.setStyles({
      'display' : 'block',
      'top'     : window.getScrollTop()
    });
    this.showcase_image_wrapper.unspin();
    this.element.addClass.delay(200, this.element, 'right');
  },
  
  showGallery: function(){
    this.element.removeClass('right');
    this.showcase_element.setStyle.delay(500, this.showcase_element, ['display','none']);
    return this;
  },

  updateShowcaseImage: function(dir){
    var current_photo = this.photos[this.current_index],
        new_src = this.options.getLargeSrc(current_photo);

    this.showcase_image.set('src', new_src);    
    if (this.showcase_image.complete) this._isLoaded();
    else this.showcase_image_wrapper.spin();

    this.fireEvent('showcaseUpdated', this);
    return this;
  },
  
  next: function(){
    this.current_index += 1;
    this._bounds_check();
    return this;
  },
  previous: function(){
    this.current_index -= 1;
    this._bounds_check();
    return this;
  },
  _bounds_check: function(){
    if (this.current_index < 0)
      this.current_index = 0;
    else if (this.current_index > this.photos.length - 1)
      this.current_index = this.photos.length - 1;
    else
      this.updateShowcaseImage();
  }
});





// orientation stuff
function handle_orientation(){
  var setOrientationClass = function(){
    if (window.orientation === 0 || window.orientation === 180)
      document.body.addClass('vertical-orientation').removeClass('horizontal-orientation');
    else
      document.body.removeClass('vertical-orientation').addClass('horizontal-orientation');      
  };

  Element.NativeEvents['orientationchange'] = 2;
  window.addEvent('orientationchange', setOrientationClass);
  setOrientationClass();
}



// domready
window.addEvent('domready', function(){  
  handle_orientation();
  window.addEvent('orientationchange', function(){
    window.scrollTo(0, window.getScroll().y);    
  });

  if (!$3N.touch)
    $(document.body).addClass('no-touch');
  else
    $(document.body).addClass('touch');
  
  if (Browser.Engine.trident){
    $('browser-message').setStyle('display','block').set('html', 'You are using Internet Explorer, there is no way you own an iPad.');
    (function(){
      $('browser-message').toggleClass('fffuuu');
    }).periodical(100);
  }
  
  var failure = function(){
    $('loading-jsonp').set('html', "Load failed - try refreshing.");
    $3N.trackEvent("Flickr", "failed");
  };

  new Request.JSONP({
    url : "http://api.flickr.com/services/rest/",
    globalFunction : 'jsonFlickrApi',
    data : { photoset_id : '72157623678289231', 
             method      : 'flickr.photosets.getPhotos', 
             api_key     : 'f31a8e4819faa5ec28ed3db580b76fb9',
             media       : 'photos',
             extras      : 'tags',             
             lang        : "en-us",
						 format      : 'json' },
    onComplete: function(resp){   
      if (resp.stat === 'fail')
        return failure();

      $('gallery').set('html',
        resp.photoset.photo.map(function(photo){
          return "<img src='http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_t.jpg'/>".substitute(photo);
        }).reverse()
      );
      
      $('photo-count').set('html', resp.photoset.photo.length + ' photos');
      
      $3N.ipg = new iPadGallery(
        $('outer'), 
        $('gallery'), 
        $('showcase-wrapper'),
        {
          touchEvent : $3N.touch ? 'tap' : 'click',
          onPhotoAdded : function(photo){
            photo.thumbnail(100,100,'thumb',100,100);
          },
          onPhotoTapped : function(photo, i){
            photo.spin();
            $3N.trackEvent("Click", resp.photoset.photo[i].id, "photo");
          },
          onShowcaseWillOpen : function(ipg){
            ipg.photos[ipg.current_index].unspin();
          },
          onShowcaseUpdated : function(ipg){
            if (!$3N.touch){
              // ipg.preloadRight = ipg.preloadRight || new Element('img', {
              //   'class' : ipg.options.showcaseImageClass, 
              //   'styles' : {visibility: 'hidden'}
              // }).inject(document.body);
              // 
              // if (ipg.current_index < ipg.photos.length - 1)
              //   ipg.preloadRight.set('src', ipg.options.getLargeSrc(ipg.photos[ipg.current_index + 1]));
              var preload = [];
              if (ipg.current_index < ipg.photos.length - 1)
                preload.include(ipg.options.getLargeSrc(ipg.photos[ipg.current_index + 1]));
              if (ipg.current_index > 0)
                preload.include(ipg.options.getLargeSrc(ipg.photos[ipg.current_index - 1]));              
              new Asset.images(preload);
            }
          },
          getLargeSrc : function(img){
            return img.get('src').replace(/_\w\.jpg/,'_b.jpg');
          },
          getMediumSrc : function(img){
            return img.get('src').replace(/_\w\.jpg/,'.jpg');            
          }
        }
      );
      
      $3N.keyboard = new Keyboard({
        preventDefault : true,
        events: {
          'right' : $3N.ipg.next.bind($3N.ipg),
          'left'  : $3N.ipg.previous.bind($3N.ipg),
          'esc'   : $3N.ipg.showGallery.bind($3N.ipg)      
        }
      }).activate();
    },
    onFailure: failure
  }).send();
});