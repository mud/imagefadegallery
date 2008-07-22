/*******************************************************************************

ImageFadeGallery, version 1.0.1 (07/03/2008)
(c) 2005 - 2008 Takashi Okamoto.

ImageFadeGallery is a JavaScript image viewer. It is freely distributable,
but this header must be included, and should not be modified. Donations are 
appreciated. For details, see the BuzaMoto website: http://buzamoto.com/

*******************************************************************************/

/* ----------------------------------------------------------------------------

1.0.1 - Added "fade down" original image before "fade up" new image.

---------------------------------------------------------------------------- */

// ---------------------- com.buzamoto Namespace

var com;
if (!com)
  com = {};
else if (typeof com != "object")
  throw new Error("com already exists and is not an object");

if (!com.buzamoto)
  com.buzamoto = {};
else if (typeof com.buzamoto != "object")
  throw new Error("com.buzamoto already exists and is not an object");

if (com.buzamoto.ImageFadeGallery)
  throw new Error("com.buzamoto.ImageFadeGallery already exists");


// ---------------------- com.buzamoto.ImageFadeGallery

com.buzamoto.ImageFadeGallery = {
  Version: '1.0.1'
}


// ---------------------- com.buzamoto.ImageFadeGallery.Gallery

com.buzamoto.ImageFadeGallery.Gallery = Class.create({
  
  initialize: function(id, imageArray, options) {
    this.obj = $(id);
    this.imageArray = imageArray;
    this.opacity = 100;
    this.fadeFrame = 0;
    this.timerID = null;
    this.apTimerID = null;
    this.imagesLoaded = new Array(this.imageArray.length);
    this.options = options;
    
    // checking options
    this.current = (this.options.startNum) ? this.options.startNum : 0;
    
    this.controller = new com.buzamoto.ImageFadeGallery.Controller(this);
    
    var self = this;
    // bind events to controls
    var control;
    ['next', 'prev', 'start', 'stop'].each(function(type) {
      if (control = $(self.obj.id + "_" + type)) {
        Event.observe(control, 'click', function(e) {
          if (type == 'start')
            self.controller.apStart(2);
          else if (type == 'stop')
            self.controller.apStop();
          else
            self.controller.move(type);
          Event.stop(e);
        });
      }
    });
    for (var i = 0; i < this.imageArray.length; i++) {
      if (control = $(this.obj.id + "_goto" + i)) {
        Event.observe(control, 'click', function(e) {
          self.controller.showImg(e);
          Event.stop(e);
        });
      }
    }
    
    if (this.options.preload) {
      window.setTimeout(function() {
        self.preloadImgs();
      }, 50);
    }
    if (this.options.autoplay > 0) {
      var delay = this.options.autoplay * 1000 + 1000; // the additional 1000 compensates for the fade in time of the next image.
      this.apTimerID = window.setTimeout(function() {
        self.controller.autoplayImgs(delay);
      }, delay);
    }
  },
  
  preloadImgs: function() {
    for (var i = 0; i < this.imageArray.length; i++) {
      this.loadImageNumber(i);
    }
  },
  
  loadImageNumber: function(imgNum) {
    // check if already loaded
    if (!this.imagesLoaded[imgNum]) {
      this.imagesLoaded[imgNum] = new Image();
      this.imagesLoaded[imgNum].src = this.imageArray[imgNum].src;
    }
  }
  
});
Object.extend(com.buzamoto.ImageFadeGallery.Gallery, {
  FADE_UP: new Array(0, 6, 11, 17, 23, 30, 38, 47, 56, 66, 75, 84, 92, 100),
  FADE_DOWN: new Array(0, 6, 11, 17, 23, 30, 38, 47, 56, 66, 75, 84)
});


// ---------------------- com.buzamoto.ImageFadeGallery.Controller

com.buzamoto.ImageFadeGallery.Controller = Class.create({
  
  /* ------------- CALLBACKS ------------- */
  /* ------------- EDITABLE -------------- */
  
  onFadeStart: function() {
    this.setTitle("...");
    this.setCaption("&nbsp;");
  },
  
  onFadeEnd: function() {
    var title = (this.imageArray[this.gallery.current].title) ? this.imageArray[this.gallery.current].title : "";
    var caption = (this.imageArray[this.gallery.current].caption) ? this.imageArray[this.gallery.current].caption : "";
    this.setTitle(title);
    this.setCaption(caption);
    this.setNumber((this.gallery.current+1) + " of " + this.imageArray.length + " images");
  },
  
  /* ------------- DON'T EDIT PAST HERE ------------- */
  
  initialize: function(gallery) {
    this.gallery = gallery;
    this.imageArray = this.gallery.imageArray;
    this.id = this.gallery.obj.id;
    
    // set initial image
    this.gallery.obj.src = this.imageArray[this.gallery.current].src;
    this.onFadeEnd();
  },
  
  setCaption: function(caption) {
    if ($(this.id+"_caption")) $(this.id+"_caption").update(caption);
  },
  
  setTitle: function(title) {
    if ($(this.id+"_title")) $(this.id+"_title").update(title);
  },
  
  setNumber: function(number) {
    if ($(this.id+"_number")) $(this.id+"_number").update(number);
  },
  
  changeImg: function(imgNum) {
    if (!this.gallery.imagesLoaded[imgNum]) {
      this.gallery.loadImageNumber(imgNum);
    }
    this.gallery.obj.src = this.gallery.imagesLoaded[imgNum].src;
  },
  
  move: function(dir) {
    if (dir == "next") this.nextImg();
    else if (dir == "prev") this.prevImg();
  },
  
  nextImg: function() {
    this.gallery.current++;
    if (this.gallery.current == this.imageArray.length) {
      this.gallery.current = 0;
    }
    this.doFade();
  },
  
  prevImg: function() {
    this.gallery.current--;
    if (this.gallery.current == -1) {
      this.gallery.current = this.imageArray.length - 1;
    }
    this.doFade();
  },
  
  showImg: function(evt) {
    var elem = Event.findElement(evt, 'a').id;
    var imgNum = parseInt(elem.substr(elem.indexOf('goto')+4));
    if (this.gallery.current != imgNum) {
      if (this.gallery.current < 0) {
        this.gallery.current = this.imageArray.length - 1;
      }
      else if (this.gallery.current > this.imageArray.length - 1) {
        this.gallery.current = 0;
      }
      else this.gallery.current = imgNum;
      this.doFade();
    }
  },
  
  doFade: function() {
    if (!this.fading) {
      this.fading = true;
      this.onFadeStart();
      this.startFade("down");
    } else {
      this.fading = false;
      var self = this;
      window.setTimeout(function() {
        self.changeImg(self.gallery.current);
      }, 50);
      this.startFade("up");
      this.gallery.obj.show();
    }
  },
  
  startFade: function(dir) {
    if (this.timerID) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
    // place delay before fade
    var self = this;
    switch(dir) {
      case "up":
        this.timerID = window.setTimeout(function() {
          self.fadeUp();
        }, 500);
        break;
      case "down":
        this.timerID = window.setTimeout(function() {
          self.fadeDown();
        }, 50);
    }
  },

  fadeUp: function() {
    if (this.timerID) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
    this.calcOpacity(this.gallery.fadeFrame);
    this.setOpacity(this.gallery.opacity);
    this.gallery.fadeFrame++;
    if (!this.gallery.obj.visible()) this.gallery.obj.show();
    if (this.gallery.fadeFrame < com.buzamoto.ImageFadeGallery.Gallery.FADE_UP.length) {
      var self = this;
      this.timerID = window.setTimeout(function() {
        self.fadeUp();
      }, 20);
    }
    else {
      this.gallery.fadeFrame = 0;
      this.onFadeEnd();
    }
  },
  
  fadeDown: function() {
    if (this.timerID) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
    this.calcOpacity(com.buzamoto.ImageFadeGallery.Gallery.FADE_DOWN.length-1 - this.gallery.fadeFrame);
    this.setOpacity(this.gallery.opacity);
    this.gallery.fadeFrame++;
    if (this.gallery.fadeFrame < com.buzamoto.ImageFadeGallery.Gallery.FADE_DOWN.length) {
      var self = this;
      this.timerID = window.setTimeout(function() {
        self.fadeDown();
      }, 20);
    }
    else {
      this.gallery.fadeFrame = 0;
      this.gallery.obj.hide();
      this.doFade();
    }
  },
  
  autoplayImgs: function(delay) {
    if (this.apTimerID) {
      window.clearTimeout(this.apTimerID);
      this.apTimerID = null;
    }
    this.nextImg();
    var self = this;
    this.apTimerID = window.setTimeout(function() {
      self.autoplayImgs(delay);
    }, delay);
  },
  
  apStart: function(delay) {
    if (!delay || delay < 1) delay = 1;
    delay = delay * 1000 + 1000;
    this.autoplayImgs(delay);
  },
  
  apStop: function(delay) {
    if (this.apTimerID) {
      window.clearTimeout(this.apTimerID);
      this.apTimerID = null;
    }
  },
  
  calcOpacity: function(frameNumber) {
    if (!this.fading)
      this.gallery.opacity = com.buzamoto.ImageFadeGallery.Gallery.FADE_UP[frameNumber];
    else
      this.gallery.opacity = com.buzamoto.ImageFadeGallery.Gallery.FADE_DOWN[frameNumber];
  },
  
  setOpacity: function(opacity) {
    var obj = this.gallery.obj.style;
    opacity = (opacity == 100) ? 99.999 : opacity;
    obj.filter = "alpha(opacity:"+opacity+")";
    obj.KHTMLOpacity = opacity/100;
    obj.MozOpacity = opacity/100;
    obj.opacity = opacity/100;
  }
});