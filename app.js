['touchstart', 'touchmove', 'touchend'].each(function(type){
  Element.NativeEvents[type] = 2;
});

Element.Events.swipe = {
  base : 'touchstart',
  condition : function(event) {
    this.store('swipeStartX', event.event.touches[0].pageX);
    this.store('swipeStartY', event.event.touches[0].pageY);    
    return false;
  },
  onAdd: function(fn){
    this.addEvent('touchmove', function(event){
      var startX = this.retrieve('swipeStartX'),
          startY = this.retrieve('swipeStartY'),
          endX   = event.event.touches[0].pageX,
          endY   = event.event.touches[0].pageY,          
          diff   = endX - startX,
          isLeftSwipe = diff < -70,
          isRightSwipe = diff > 70;
      
      if (this.retrieve('swipeStartX') && (isRightSwipe || isLeftSwipe)){
        this.store('swipeStartX', false);
        fn.call(this, {
          'direction' : isRightSwipe ? 'right' : 'left', 
          'startX'    : startX,
          'endX'      : endX
        });
      }
      
      if (Math.abs(startY - endY) < Math.abs(startX - endX))
        return false;
    });
  }
};




var iPadGallery = new Class({
  Implements: [Events, Options],
  
  options : {
    getLargeSrc : function(img){
      return img.get('src');
    }
  },
  
  current_index : 0,
  
  initialize: function(elem, ge, sce, si, photos_selector, options){
    this.setOptions(options);
    this.element          = document.id(elem);
    this.gallery_element  = document.id(ge);
    this.showcase_element = document.id(sce);
    this.showcase_image   = document.id(si);
    this.photos_selector  = photos_selector;
    
    this.setPhotos();
    this.attach();
  },
  
  attach: function(){
    var thiz = this;
    
    this.gallery_element.addEvent('click:relay(' + this.photos_selector + ')', function(){
      thiz.fireEvent('photoClicked', this);
      thiz.current_index = this.retrieve('iPadGalleryIndex');
      thiz.openShowcase();
    });
    
    this.showcase_image
      .addEvent('click', this.showGallery.bind(this))
      .addEvent('swipe', function(info){
        if (info.direction === 'right')
          this.current_index -= 1;
        else if (info.direction === 'left')
          this.current_index += 1;
        
        if (this.current_index < 0)
          this.current_index = 0;
        else if (this.current_index > this.photos.length - 1)
          this.current_index = this.photos.length - 1;
        else
          this.updateShowcaseImage();
    }.bind(this));
    
    return this;
  },
  
  showGallery: function(){
    this.element.removeClass('right');
    this.showcase_element.setStyle.delay(500, this.showcase_element, ['display','none']);
  },
  openShowcase: function(){
    var current_photo = this.photos[this.current_index],
        big_src = this.options.getLargeSrc(current_photo);

    new Asset.image(big_src, {
      onload : function(){
        this.fireEvent('showcaseWillOpen', this);
        this.showcase_element.setStyles({
          'display' : 'block',
          'top'     : window.getScrollTop()
        });
        this.showcase_image.set('src', big_src);
        this.element.addClass.delay(200, this.element, 'right');
      }.bind(this)
    });
  },
  updateShowcaseImage: function(){
    var current_photo = this.photos[this.current_index],
        new_src = this.options.getLargeSrc(current_photo);
        
    this.showcase_image.set('src', new_src);
  },
  
  setPhotos: function(photos){
    this.photos = photos || this.gallery_element.getElements(this.photos_selector);
    
    this.photos.each(function(photo, i){
      this.fireEvent('photoAdded', photo);
      photo.store('iPadGalleryIndex', i);
    }, this);
    
    return this;
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
      $('gallery').set('html',
        resp.photoset.photo.map(function(photo){
          return "<img src='http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_m.jpg'/>".substitute(photo);
        }).reverse()
      );

      new iPadGallery(
        $('outer'), 
        $('gallery'), 
        $('showcase-wrapper'), 
        $('showcase-image'), 
        'img', 
        {
          onPhotoAdded : function(photo){
            photo.thumbnail(100,100,'thumb',240,240);
          },
          onPhotoClicked : function(photo){
            photo.spin();
          },
          onShowcaseWillOpen : function(ipg){
            ipg.photos[ipg.current_index].unspin();
          },
          getLargeSrc : function(img){
            return img.get('src').replace(/_\w\.jpg/,'_b.jpg');
          }
        }
      );
    }
  }).send();
});