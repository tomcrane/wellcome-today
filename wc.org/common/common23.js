let canvasList;
let lastLoadedManifest;

function onLoadQueryStringResource(iiifResource){
    if(iiifResource['@type'] && iiifResource['@type'] == "sc:Collection"){
        $.getJSON(iiifResource.manifests[0]['@id'], function (cManifest) {
            load(cManifest);
        });
    } else {
        load(iiifResource);
    }
}

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
