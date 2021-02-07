
var dlcsIoThumbs = "dlcs.io/thumbs/";
var dlcsIoThumbsCheck = "dlcs.io/thumbschk/";
var dlcsIoThumbsNoCheck = "dlcs.io/thumbsnochk/";

$(function() {
    $('#imfeelinglucky').on('click', ImFeelingLucky);
    $('#schBox').typeahead({
        minLength: 4,
        highlight: true
    },
    {
        name: 'flat-manifs',
        source: getFlatManifestations,
        async: true,
        limit: 50,
        display: formatFlatManifestation
    });
    $('#schBox').bind('typeahead:select', function(ev, suggestion) {
        loadSuggestion(suggestion);
    });
    $('#schBox').bind('typeahead:asyncrequest', function(ev) {
        $('#typeaheadWait').show();
    });
    $('#schBox').bind('typeahead:render', function(ev) {
        $('#typeaheadWait').hide();
    });
});

var gfmTimeout;
var urlRoot = "https://wellcomelibrary.org";

function loadSuggestion(suggestion){
    window.location.href = window.location.pathname + "?manifest=" + urlRoot + "/iiif/" + suggestion.id + "/manifest";
}

function getFlatManifestations(query, syncResults, asyncResults) {
    if (gfmTimeout) {
        clearTimeout(gfmTimeout);
    }
    gfmTimeout = setTimeout(function () {
        console.log('autocomplete - ' + query);
        $.ajax(urlRoot + "/service/bNumberSuggestion?q=" + query).done(function (results) {
            asyncResults(results);
        });
    }, 300);
}

function ImFeelingLucky(){
    $.ajax(urlRoot + "/service/bNumberSuggestion?q=imfeelinglucky").done(function (results) {
        loadSuggestion(results[0]);    
    });
}

function formatFlatManifestation(fm) {
    return fm.id + " | " + fm.label;
}

function getSearchService(manifest){            
    if(manifest.service)
    {
        for(si = 0; si<manifest.service.length; si++){
            var svc = manifest.service[si];
            if(svc && svc.profile && svc.profile == "http://iiif.io/api/search/0/search"){
                return svc;
            }
        }
    }
    return null;
}

function getThumb(canvas, thumbSize){
    if(!canvas.thumbnail){
        return null;
    }
    if(typeof canvas.thumbnail === "string"){
        return canvas.thumbnail;
    }
    var thumb = canvas.thumbnail['@id'];
    if(canvas.thumbnail.service && canvas.thumbnail.service.sizes){
        // manifest gives thumb size hints
        // dumb version exact match and assumes ascending - TODO: https://gist.github.com/tomcrane/093c6281d74b3bc8f59d
        var particular = getParticularSizeThumb(canvas, thumbSize);
        if(particular) return particular;
    }
    return thumb;
}

function modifyThumbSource(imageId){
    let thumbSource = localStorage.getItem('thumbSource');
    if(thumbSource){
        return imageId.replace(dlcsIoThumbs, thumbSource);
    }
    return imageId;
}

function getParticularSizeThumb(canvas, thumbSize){
    var sizes = canvas.thumbnail.service.sizes;
    for(var i=sizes.length - 1; i>=0; i--){
        if((sizes[i].width == thumbSize || sizes[i].height == thumbSize) && sizes[i].width <= thumbSize && sizes[i].height <= thumbSize){
            let idBase = modifyThumbSource(canvas.thumbnail.service['@id']);
            return idBase + "/full/" + sizes[i].width + "," + sizes[i].height + "/0/default.jpg";
        }
    }
    return null;
}


function getThumbHtml(canvas, thumbSize, elementId){
    let thumbHtml = '<div class="tc">' + (canvas.label || '') + '<br/>';
    let thumb = getThumb(canvas, thumbSize);
    if(!thumb){ 
        thumbHtml += '<div class="thumb-no-access">Image not available</div></div>';
    } else {
        // This is a temporary hack to get sizes until sorty, getThumbnail etc are unified with this
        let sizeParam = /full\/([^\/]*)\/(.*)/g.exec(thumb);
        let dimensions = "";
        if(sizeParam && sizeParam[1] && sizeParam[1].indexOf(",") > 0) {
            wh = sizeParam[1].split(",");
            dimensions = "width='" + wh[0] + "' height='" + wh[1] + "'";
        }
        let id = "";
        if(elementId){
            id = "id='" + elementId + "'";
        }
        thumbHtml += '<img ' + id + ' class="thumb" title="' + canvas.label + '" data-uri="' + canvas['@id'] + '" data-src="' + thumb + '" ' + dimensions + '/></div>';
    }
    return thumbHtml;
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
