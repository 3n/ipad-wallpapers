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
  
  initialize: function(elem, sce, si, photos_selector, options){
    this.setOptions(options);
    this.element  = document.id(elem); //outer
    this.showcase_element = sce;
    this.showcase_image = si;
    this.photos_selector = photos_selector;
    this.photos = this.element.getElements(this.photos_selector);
    
    this.attach();
  },
  
  attach: function(){
    var tmp = this;
    this.element.addEvent('click:relay(' + this.photos_selector + ')', function(){
      var index = this.retrieve('iPadGalleryIndex');
          
      tmp.showcase_element.addClass('showing').setStyle('top', window.getScrollTop());
      var big_src = this.get('src').replace(/_\w\.jpg/,'_b.jpg'); // todo options func
      
      this.spin(); // todo events
      new Asset.image(big_src, {
        onload: function(){
          this.unspin(); // todo events
          tmp.showcase_element.setStyle('display','block');
          tmp.showcase_image.set('src', big_src).store('iPadGalleryIndex', index);
          tmp.element.addClass.delay(200, tmp.element, 'right');
        }.bind(this)
      });
    });
    
    this.showcase_image.addEvent('click', function(){
      this.element.removeClass('right');
      this.showcase_element.setStyle.delay(500, this.showcase_element, ['display','none']);
    }.bind(this));

    this.showcase_image.addEvent('swipe', function(info){
      if (info.direction === 'right')
        var new_index = this.retrieve('iPadGalleryIndex')-1;
      else if (info.direction === 'left')
        var new_index = this.retrieve('iPadGalleryIndex')+1;

      this.store('iPadGalleryIndex', new_index)
      this.set('src', tmp.photos[new_index].get('src').replace(/_\w\.jpg/,'_b.jpg'))
    });
  }
})





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
  
  $('showcase-wrapper').addEvent('click', function(){ 
    this.removeClass('showing'); 
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
      
      
      
      var pics = $('gallery').getChildren();
      pics.each(function(child, i){
        pics.push( child.thumbnail(100,100,'thumb',240,240).store('iPadGalleryIndex', i) );
      });
      
      new iPadGallery($('outer'), $('showcase-wrapper'), $('showcase-image'), '.thumb img');
      
      // $('gallery').addEvent('click:relay(.thumb)', function(){
      //   var index = this.retrieve('galleryIndex'),
      //       img = this.getFirst();
      //       
      //   $('showcase-wrapper').addClass('showing').setStyle('top', window.getScrollTop());
      //   var big_src = img.get('src').replace(/_\w\.jpg/,'_b.jpg');
      //   
      //   img.spin();
      //   new Asset.image(big_src, {
      //     onload: function(){
      //       img.unspin();
      //       $('showcase-wrapper').setStyle('display','block');
      //       $('showcase-image').set('src', big_src).store('galleryIndex', index);
      //       $('outer').addClass.delay(200, $('outer'), 'right');
      //     }
      //   });
      // });
      
//       $('showcase-image').addEvent('click', function(){
//         $('outer').removeClass('right');
//         $('showcase-wrapper').setStyle.delay(500, $('showcase-wrapper'), ['display','none']);
//       });
//       
//       $('showcase-image').addEvent('swipe', function(info){
//         console.log(info.direction)
//         if (info.direction === 'left')
//           var new_index = this.retrieve('galleryIndex')-1;
// 
//         else   if (info.direction === 'right')
//           var new_index = this.retrieve('galleryIndex')+1;
// 
// this.store('galleryIndex', new_index)
//           this.set('src', pics[new_index].get('src').replace(/_\w\.jpg/,'_b.jpg'))
//       });
      
      window.addEvent('orientationchange', function(){
        window.scrollTo(0, window.getScroll().y);
      });
    }
  }).send();
});