
$(function() {
    $('#imfeelinglucky').on('click', ImFeelingLucky);
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
        loadSuggestion(suggestion);
    });
    $('.typeahead').bind('typeahead:asyncrequest', function(ev) {
        $('#typeaheadWait').show();
    });
    $('.typeahead').bind('typeahead:render', function(ev) {
        $('#typeaheadWait').hide();
    });
});

var gfmTimeout;

function loadSuggestion(suggestion){
    var urlRoot = localStorage.get("iiifSource");
    window.location.href = window.location.pathname + "?manifest=" + urlRoot + "/presentation/" + suggestion.id;
}

function getFlatManifestations(query, syncResults, asyncResults) {
    if (gfmTimeout) {
        clearTimeout(gfmTimeout);
    }
    gfmTimeout = setTimeout(function () {
        console.log('autocomplete - ' + query);
        // formerly bNumberSuggestion
        $.ajax(urlRoot + "/service/manifestation-search?q=" + query).done(function (results) {
            asyncResults(results);
        });
    }, 300);
}

function ImFeelingLucky(){
    $.ajax(urlRoot + "/service/manifestation-search?q=imfeelinglucky").done(function (results) {
        loadSuggestion(results[0]);    
    });
}

function formatFlatManifestation(fm) {
    return fm.id + " | " + fm.label;
}