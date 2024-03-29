
var localhostHttp = "http://localhost:8084";
var localhostHttp3 = "https://localhost:8084";
var wcOrgTest = "https://iiif-test.wellcomecollection.org";
var wcOrgProd = "https://iiif.wellcomecollection.org";


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


function langMap(langMap, separator){
    // we can do language selection later; for now this extracts the "en" key and concatenates the strings
    if(langMap){
        if(!separator) separator = "\r\n";
        var strings = langMap["en"];
        if(!strings) strings = langMap["none"];
        if(strings){
            return strings.join(separator);
        }
    }
    return null;
}


function getSearchService(manifest){            
    if(manifest.service)
    {
        for(si = 0; si<manifest.service.length; si++){
            var svc = manifest.service[si];
            if(svc && svc.profile && svc.profile == "http://iiif.io/api/search/1/search"){
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
    var thumb = canvas.thumbnail[0].id;
    if(canvas.thumbnail[0].service && canvas.thumbnail[0].service[0].sizes){
        // manifest gives thumb size hints
        // dumb version exact match and assumes ascending - TODO: https://gist.github.com/tomcrane/093c6281d74b3bc8f59d
        var particular = getParticularSizeThumb(canvas, thumbSize);
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


function getThumbHtml(canvas, thumbSize, elementId){
    let thumbHtml = '<div class="tc">' + (langMap(canvas.label) || '') + '<br/>';
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
        thumbHtml += '<img ' + id + ' class="thumb" title="' + langMap(canvas.label) + '" data-uri="' + canvas.id + '" data-src="' + thumb + '" ' + dimensions + '/></div>';
    }
    return thumbHtml;
}
