thumbHTML

var thumbHtml = '<div class="tc">' + (langMap(canvas.label) || '') + '<br/>';
var thumb = getThumb(canvas);
if(!thumb){ 
    thumbHtml += '<div class="thumb-no-access">Image not available</div></div>';
} else {
    // This is a temporary hack to get sizes until sorty, getThumbnail etc are unified with this
    var sizeParam = /full\/([^\/]*)\/(.*)/g.exec(thumb);
    var dimensions = "";
    if(sizeParam && sizeParam[1] && sizeParam[1].indexOf(",") > 0) {
        wh = sizeParam[1].split(",");
        dimensions = "width='" + wh[0] + "' height='" + wh[1] + "'";
    }
    thumbHtml += '<img class="thumb" title="' + langMap(canvas.label) + '" data-uri="' + canvas.id + '" data-src="' + thumb + '" ' + dimensions + '/></div>';
}




function getThumb(canvas){
    if(!canvas.thumbnail){
        return null;
    }
    var thumb = canvas.thumbnail[0].id;
    if(canvas.thumbnail[0].service && canvas.thumbnail[0].service[0].sizes){
        // manifest gives thumb size hints
        // dumb version exact match and assumes ascending - TODO: https://gist.github.com/tomcrane/093c6281d74b3bc8f59d
        var particular = getParticularSizeThumb(canvas, localStorage.getItem('thumbSize'));
        if(particular) return particular;
    }
    return thumb;
}

function getParticularSizeThumb(canvas, thumbSize){
    var sizes = canvas.thumbnail[0].service[0].sizes;
    for(var i=sizes.length - 1; i>=0; i--){
        if((sizes[i].width == thumbSize || sizes[i].height == thumbSize) && sizes[i].width <= thumbSize && sizes[i].height <= thumbSize){
            // this is still an ImageService2
            return canvas.thumbnail[0].service[0]["@id"] + "/full/" + sizes[i].width + "," + sizes[i].height + "/0/default.jpg";
        }
    }
    return null;
}





/**
 * jQuery Unveil
 * A very lightweight jQuery plugin to lazy load images
 * http://luis-almeida.github.com/unveil
 *
 * Licensed under the MIT license.
 * Copyright 2013 Lu�s Almeida
 * https://github.com/luis-almeida
 */

; (function ($) {

    $.fn.unveil = function (threshold, callback) {

        var $v = $(".viewer"), $w = $(window),
            th = threshold || 0,
            retina = window.devicePixelRatio > 1,
            attrib = retina ? "data-src-retina" : "data-src",
            images = this,
            loaded;

        this.one("unveil", function () {
            var source = this.getAttribute(attrib);
            source = source || this.getAttribute("data-src");
            if (source) {
                console.log("setting src " + source);
                this.setAttribute("src", source);
                if (typeof callback === "function") callback.call(this);
            }
        });

        function unveil() {
            var inview = images.filter(function () {
                var $e = $(this);
                if ($e.is(":hidden")) return;

                var wt = $w.scrollTop(),
                    wb = wt + $w.height(),
                    et = $e.offset().top,
                    eb = et + $e.height();

                return eb >= wt - th && et <= wb + th;
            });

            loaded = inview.trigger("unveil");
            images = images.not(loaded);
        }

        $w.on("scroll.unveil resize.unveil lookup.unveil", unveil);
        $v.on("scroll.unveil resize.unveil lookup.unveil", unveil);

        unveil();

        return this;

    };

})(window.jQuery);

