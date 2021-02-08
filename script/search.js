
var canvasList;
var canvasMap;
var currentManifest = null;
var currentQuery = "";

$(function() {
    processQueryString();    
    $('#manifestWait').hide();   

    $("#iiifSearchForm").submit(function( event ) {
        event.preventDefault();
        loadNewSearch({ "match": $("#autoCompleteBox").val() });
    });
});

function processQueryString(){    
    var manifestArg = /manifest=([^\&]*)/g.exec(window.location.search);
    var qArg = /q=([^\&]*)/g.exec(window.location.search);
    if(qArg && qArg[1]){
        currentQuery = decodeURI(qArg[1]);
        $("#autoCompleteBox").val(currentQuery);
    }
    if(manifestArg && manifestArg[1]){     
        var currentManifestUri = manifestArg[1];   
        $('#manifestWait').show();
        $('#title').text('loading ' + currentManifestUri + '...');
        $.getJSON(currentManifestUri, function (iiifResource) {
            if(iiifResource['@type'] == "sc:Collection"){
                currentManifestUri = iiifResource.manifests[0]['@id'];
                $.getJSON(currentManifestUri, function (cManifest) {
                    load(cManifest);
                });
            } else {
                load(iiifResource);
            }
        });
    }
}

function load(manifest){   
    currentManifest = manifest;
    $('#title').text(manifest.label);
    $('#iiifManifestUri').attr("href", manifest["@id"]);
    $('#thumbViewerUri').attr("href", "thumbs.html?manifest=" + manifest["@id"]);
    $('#annoPageUri').attr("href", "annodump.html?manifest=" + manifest["@id"]);
    if(manifest["@id"].indexOf("wellcomelibrary.org")!= -1){
        var bnum = manifest["@id"].split("/")[4];
        if(bnum){
            $('#itemPageUri').attr("href", "http://wellcomelibrary.org/item/" + bnum);
        }
    }
    if(manifest.mediaSequences){
        alert("This is not a normal IIIF manifest - it's an 'IxIF' extension for audio, video, born digital. No search support yet!");
    } else {
        canvasList = manifest.sequences[0].canvases;
        doSearch();
    }
    $('#typeaheadWait').hide();
    $('#manifestWait').hide();
}


function doSearch(){ 
    $('#searchResultsBlock').empty();
    $("#searchSummary").empty();
    let searchService = getSearchService(currentManifest);
    if(!searchService)
    {
        $('#searchResultsBlock').append("<p>This manifest does not have a search service.</p>");
        return;
    }      
    let queryUrl = searchService["@id"] + "?q=" + currentQuery;
    $.getJSON(queryUrl, function (searchResults) {
        $("#searchSummary").html("Search results for <strong><em>" + currentQuery + "</em></strong>:");
        canvasMap = new Map(canvasList.map(c => [c["@id"], c]));
        let annoMap = new Map(searchResults.resources.map(r => [r["@id"], r]));
        for(let i=0; i<searchResults.hits.length; i++){
            let hit = searchResults.hits[i];
            hit.targets = [];
            hit.index = i;
            for(let j=0; j<hit.annotations.length; j++){
                let anno = annoMap.get(hit.annotations[j]);
                hit.targets.push({
                    id: "h" + hit.index + "_t" + j,
                    index: j,
                    text: anno.chars,
                    region: /#xywh=(.*)/g.exec(anno.on)[1],
                    canvas: canvasMap.get(anno.on.split("#")[0])
                })
            }
            renderHit(hit);
        }
        $("img.thumb").unveil(300);
    });
}

function renderHit(hit){
    let h = "";
    h += "<div class='searchHit' id='h_" + hit.index + "'>";
    for(let t=0; t<hit.targets.length; t++){
        let target = hit.targets[t];
        h += getThumbHtml(target.canvas, localStorage.getItem("thumbSize", 200), "im_" + target.id);    
        h += "<div class='lineHighlight' id='hl_" + target.id + "'></div>";
    }
    h += "  <p>Match: <strong>" + hit.match + "</strong></p>";
    h += "</div>";
    $('#searchResultsBlock').append(h);
    for(let t=0; t<hit.targets.length; t++){
        let target = hit.targets[t];
        let hl = $("#hl_" + target.id);
        let img = $("#im_" + target.id);
        let scaleFactor = img[0].clientWidth / target.canvas.width;
        var xywh = target.region.split(",");
        var stylePos = ["left", "top", "width", "height"];
        var offsets = [img[0].offsetLeft, img[0].offsetTop, 0, 0];
        xywh.map(function(val, idx){
            hl.css(stylePos[idx], (val*scaleFactor + offsets[idx]) + "px");
        });
    }
}

$(function() {
    $('#autoCompleteBox').typeahead({
        minLength: 3,
        highlight: true
    },
    {
        name: 'iiif-autocomplete',
        source: getAutocomplete,
        async: true,
        limit: 50,
        display: formatAutocomplete
    });
    $('#autoCompleteBox').bind('typeahead:select', function(ev, suggestion) {
        loadNewSearch(suggestion);
    });
    $('#autoCompleteBox').bind('typeahead:asyncrequest', function(ev) {
        $('#typeaheadWait').show();
    });
    $('#autoCompleteBox').bind('typeahead:render', function(ev) {
        $('#typeaheadWait').hide();
    });
});

var schTimeout;

function loadNewSearch(autoCompleteResult){
    if(currentManifest){
        window.location.href = window.location.pathname + "?manifest=" + currentManifest["@id"] + "&q=" + autoCompleteResult.match;
    }
}

function getAutocomplete(query, syncResults, asyncResults) {
    var searchService = getSearchService(currentManifest);
    if(!searchService){
        console.log("No search service");
        return;
    }
    var autoCompleteService = searchService.service;
    if(!autoCompleteService){
        console.log("No autoCompleteService on search service");
        return;
    }
    if (schTimeout) {
        clearTimeout(schTimeout);
    }
    schTimeout = setTimeout(function () {
        console.log('autocomplete - ' + query);
        $.ajax(autoCompleteService["@id"] + "?q=" + query).done(function (results) {
            // for some reason autocomplete is a string! oops.
            if(!results.terms){
                results = JSON.parse(results);
            }
            asyncResults(results.terms);
        });
    }, 300);
}

function formatAutocomplete(term) {
    return term.match;
}