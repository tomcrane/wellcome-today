$(function() {
    var qs = /manifest=(.*)/g.exec(window.location.search);
    if(qs && qs[1]){        
        $('#title').text('loading ' + qs[1] + '...');
        $.getJSON(qs[1], function (iiifResource) {
            if(iiifResource['@type'] == "sc:Collection"){
                $.getJSON(iiifResource.manifests[0]['@id'], function (cManifest) {
                    load(cManifest);
                });
            }
            load(iiifResource);
        });
    }
});

var subjectManifest;

function load(manifest){    
    subjectManifest = manifest;
    $('#title').text(manifest.label);
    var thumbs = $('#thumbs');
    thumbs.empty();
    $.each(manifest.sequences[0].canvases, function(i, canvas){
        var mainImg = getMainImg(canvas);
        var thumb = getThumb(canvas);
        thumbs.append('<div class="tc">' + canvas.label + '<br/><img class="thumb" title="' + canvas.label + '" data-uri="' + mainImg + '" src="' + thumb + '" /></div>')
    });
    
    $('img.thumb').click(function(){
        $('img.thumb').css('border', '2px solid white');
        $(this).css('border', '2px solid tomato');
        $('#bigImage').attr('src', $(this).attr('data-uri'));
        $('#mdlLabel').text($(this).attr('title'))
        $('#imgModal').modal();
    });
}

function setModal() {

}

function getMainImg(canvas){
    return canvas.images[0].resource['@id'];
}

function getThumb(canvas){
    return canvas.thumbnail['@id'];
}

$('.typeahead').typeahead({
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

$('.typeahead').bind('typeahead:select', function(ev, suggestion) {
  window.location.href = window.location.pathname + "?manifest=http://library-uat.wellcomelibrary.org/iiif/" + suggestion.id + "/manifest";
});

var gfmTimeout;

function getFlatManifestations(query, syncResults, asyncResults) {
    if (gfmTimeout) {
        clearTimeout(gfmTimeout);
    }
    gfmTimeout = setTimeout(function () {
        console.log('autocomplete - ' + query);
        $.ajax("http://library-uat.wellcomelibrary.org/service/bNumberSuggestion?q=" + query).done(function (results) {
            asyncResults(results);
        });
    }, 300);
}

function formatFlatManifestation(fm) {
    return fm.id + " | " + fm.label;
}