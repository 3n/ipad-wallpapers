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
    preload : true
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
  },
  
  setPhotos: function(photos){
    this.photos = photos || this.gallery_element.getElements(this.options.photosSelector);

    this.photos.each(function(photo, i){      
      this.fireEvent('photoAdded', photo);
      photo.addEvent('tap', function(){
        this.fireEvent('photoTapped', photo);
        this.current_index = i;
        this.updateShowcaseImage();
      }.bind(this));      
    }, this);
    
    return this;
  },
  
  attach: function(){
    var thiz = this;
    
    this.showcase_image_wrapper
      .addEvent('tap', this.showGallery.bind(this))
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
          this.updateShowcaseImage(info.direction);
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
  },

  updateShowcaseImage: function(dir){
    var current_photo = this.photos[this.current_index],
        new_src = this.options.getLargeSrc(current_photo);

    this.showcase_image.set('src', new_src);    
    if (this.showcase_image.complete) this._isLoaded();
    else this.showcase_image_wrapper.spin();

    // this.preloadRight = this.preloadRight || new Element('img', {
    //   'class' : this.options.showcaseImageClass, 
    //   'style' : {visibility: 'hidden'}
    // }).inject(document.body);
    
    // if (this.current_index < this.photos.length - 1)
    //   this.preloadRight.set('src', this.options.getLargeSrc(this.photos[this.current_index + 1]));
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
          return "<img src='http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_t.jpg'/>".substitute(photo);
        }).reverse()
      );
      
      $('photo-count').set('html', resp.photoset.photo.length + ' photos');
      $('footer').setStyle('display','block');
      new iPadGallery(
        $('outer'), 
        $('gallery'), 
        $('showcase-wrapper'),
        {
          onPhotoAdded : function(photo){
            photo.thumbnail(100,100,'thumb',100,100);
          },
          onPhotoTapped : function(photo){
            photo.spin();
          },
          onShowcaseWillOpen : function(ipg){
            ipg.photos[ipg.current_index].unspin();
          },
          getLargeSrc : function(img){
            return img.get('src').replace(/_\w\.jpg/,'_b.jpg');
          },
          getMediumSrc : function(img){
            return img.get('src').replace(/_\w\.jpg/,'.jpg');            
          }
        }
      );
    }
  }).send();
});