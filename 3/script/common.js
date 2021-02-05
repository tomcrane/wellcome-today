var lastLoadedManifest;
var localhostHttp = "http://localhost:8084";
var localhostHttp3 = "https://localhost:8084";
var wcOrgTest = "https://iiif-test.wellcomecollection.org";
var wcOrgProd = "https://iiif.wellcomecollection.org";

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
    window.location.href = window.location.pathname + "?manifest=" + localStorage.getItem("iiifSource") + "/presentation/" + suggestion.id;
}

function getFlatManifestations(query, syncResults, asyncResults) {
    if (gfmTimeout) {
        clearTimeout(gfmTimeout);
    }
    gfmTimeout = setTimeout(function () {
        console.log('autocomplete - ' + query);
        // formerly bNumberSuggestion
        $.ajax(localStorage.getItem("iiifSource") + "/service/suggest-b-number?q=" + query).done(function (results) {
            asyncResults(results);
        });
    }, 300);
}

function ImFeelingLucky(){
    $.ajax(localStorage.getItem("iiifSource") + "/service/suggest-b-number?q=imfeelinglucky").done(function (results) {
        loadSuggestion(results[0]);    
    });
}

function formatFlatManifestation(fm) {
    return fm.id + " | " + fm.label;
}

function makeIIIFSourceSelector(){
    // Where are searches and "I'm feeling lucky" targeted?
    var html = "<select id='manifestSource'>";
    html += "<option value='" + wcOrgProd + "'>" + wcOrgProd + "</option>";
    html += "<option value='" + wcOrgTest + "'>" + wcOrgTest + "</option>";
    html += "<option value='" + localhostHttp3 + "'>" + localhostHttp3 + "</option>";
    html += "<option value='" + localhostHttp + "'>" + localhostHttp + "</option>";
    html += "</select>";
    $('#iiifSourceSelector').append(html);
    $('#thumbSizeSelector').removeClass("col-md-2").addClass("col-md-1");
    $('#iiifSourceSelector').addClass("col-md-3");
    $('#mainSearch').removeClass("col-md-10").addClass("col-md-8");
    $('#iiifSourceSelector').show();
    
    var iiifSource = localStorage.getItem('iiifSource');
    if(!iiifSource){
        iiifSource = wcOrgProd;
        localStorage.setItem('iiifSource', iiifSource);
    }
    if(iiifSource != wcOrgProd){
        $("#manifestSource option[value='" + iiifSource + "']").prop('selected', true);
    }
    $('#manifestSource').change(function(){
        var newVal =  $("#manifestSource").val();
        var currentSource = localStorage.getItem("iiifSource");
        localStorage.setItem('iiifSource', newVal);
        if(lastLoadedManifest){
            var newManifest = lastLoadedManifest.replace(currentSource, newVal);
            location.href = location.pathname + "?manifest=" + newManifest;
        }
    });
}


function langMap(langMap){
    // we can do language selection later; for now this extracts the "en" key and concatenates the strings
    var strings = langMap["en"];
    if(!strings) strings = langMap["none"];
    if(strings){
        return strings.join('\r\n');
    }
    return null;
}