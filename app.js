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
      
      $('gallery').getChildren().thumbnail(100,100,'thumb',240,240);
      
      $('gallery').addEvent('click:relay(.thumb)', function(){
        var img = this.getFirst();
        $('showcase-wrapper').addClass('showing').setStyle('top', window.getScrollTop());
        var big_src = img.get('src').replace(/_\w\.jpg/,'_b.jpg');
        
        img.spin();
        new Asset.image(big_src, {
          onload: function(){
            img.unspin();
            $('showcase-wrapper').setStyle('display','block');
            $('showcase-image').set('src', big_src);        
            $('outer').addClass.delay(200, $('outer'), 'right');
          }
        });
      });
      
      $('showcase-image').addEvent('click', function(){
        $('outer').removeClass('right');
        $('showcase-wrapper').setStyle.delay(500, $('showcase-wrapper'), ['display','none']);
      });
      
      window.addEvent('orientationchange', function(){
        window.scrollTo(0, window.getScroll().y);
      });
    }
  }).send();
});