window.addEvent('domready', function(){
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
             extras      : 'date_taken,owner_name,tags',             
             lang        : "en-us",
						 format      : 'json' },
    onComplete: function(resp){
      $('gallery').set('html',
        resp.photoset.photo.map(function(photo){
          return "<img src='http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_m.jpg'/>".substitute(photo);
        }).reverse()
      );
      
      $('gallery').getChildren().thumbnail(240,240,'thumb');
      $('gallery').addEvent('click:relay(.thumb)', function(){
        var img = this.getFirst();
        $('showcase-wrapper').addClass('showing').setStyle('top', window.getScrollTop());
        $('showcase-image').set('src', img.get('src').replace('_m.jpg','_b.jpg'));
      });
    }
  }).send();
});