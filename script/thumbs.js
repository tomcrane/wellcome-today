$(function() {
    var thumbSize = localStorage.getItem('thumbSize');
    if(!thumbSize){
        thumbSize = 100;
        localStorage.setItem('thumbSize', thumbSize);
    }
    if(thumbSize != 100){
        $("#thumbSize option[value='" + thumbSize + "']").prop('selected', true);
    }
    $('#thumbSize').change(function(){
        var ts =  $("#thumbSize").val();
        localStorage.setItem('thumbSize', ts);
        processQueryString();
    });
    processQueryString();
    $('button.btn-prevnext').click(function(){
        canvasId = $(this).attr('data-uri');
        selectForModal(canvasId, $("img.thumb[data-uri='" + canvasId + "']"));
    });
});

function processQueryString(){
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
}

var canvasList;

function load(manifest){    
    canvasList = manifest.sequences[0].canvases;
    $('#title').text(manifest.label);
    var thumbs = $('#thumbs');
    thumbs.empty();
    $.each(canvasList, function(i, canvas){
        var thumb = getThumb(canvas);
        thumbs.append('<div class="tc">' + canvas.label + '<br/><img class="thumb" title="' + canvas.label + '" data-uri="' + canvas['@id'] + '" src="' + thumb + '" /></div>')
    });
    
    $('img.thumb').click(function(){
        selectForModal($(this).attr('data-uri'), $(this));
        $('#imgModal').modal();
    });
    $('#typeaheadWait').hide();
}

function selectForModal(canvasId, $image) {
    $('img.thumb').css('border', '2px solid white');
    $image.css('border', '2px solid tomato');
    var cvIdx = findCanvasIndex(canvasId);
    if(cvIdx != -1){
        var canvas = canvasList[cvIdx];
        $('#bigImage').attr('src', getMainImg(canvas));
        $('#mdlLabel').text(canvas.label);
        if(cvIdx > 0){
            $('#mdlPrev').prop('disabled', false);
            prevCanvas = canvasList[cvIdx - 1];
            $('#mdlPrev').attr('data-uri', prevCanvas['@id']);
            $('#mdlPrev').text('prev (' + prevCanvas.label + ')');
        } else {
            $('#mdlPrev').prop('disabled', true);
            $('#mdlPrev').text('prev');
        }        
        if(cvIdx < canvasList.length - 1){
            $('#mdlNext').prop('disabled', false);
            nextCanvas = canvasList[cvIdx + 1];
            $('#mdlNext').attr('data-uri', nextCanvas['@id']);
            $('#mdlNext').text('next (' + nextCanvas.label + ')');
        } else {
            $('#mdlNext').prop('disabled', true);
            $('#mdlNext').text('next');
        }
    }
}

function findCanvasIndex(canvasId){
    for(idx = 0; idx < canvasList.length; idx++){
        if(canvasId == canvasList[idx]['@id']){
            return idx;
        }
    }
    return -1;
}

function getMainImg(canvas){
    return canvas.images[0].resource['@id'];
}

function getThumb(canvas){
    if(typeof canvas.thumbnail === "string"){
        return canvas.thumbnail;
    }
    var thumb = canvas.thumbnail['@id'];
    if(canvas.thumbnail.service && canvas.thumbnail.service.sizes){
        // manifest gives thumb size hints
        var sizes = canvas.thumbnail.service.sizes;
        // dumb version exact match and assumes ascending - TODO: https://gist.github.com/tomcrane/093c6281d74b3bc8f59d
        var thumbSize = localStorage.getItem('thumbSize');
        for(var i=sizes.length - 1; i>=0; i--){
            if(sizes[i].width == thumbSize || sizes[i].height == thumbSize){
                thumb = canvas.thumbnail.service['@id'] + "/full/" + sizes[i].width + "," + sizes[i].height + "/0/default.jpg";
                break;
            }
        }
    }
    return thumb;
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

$('.typeahead').bind('typeahead:asyncrequest', function(ev) {
    $('#typeaheadWait').show();
});
$('.typeahead').bind('typeahead:render', function(ev) {
    $('#typeaheadWait').hide();
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