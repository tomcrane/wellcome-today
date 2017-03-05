
var canvasList;
var pageSize = 10;
var currentPage = 0;
var currentManifest = "";

$(function() {
    processQueryString();    
    $('#manifestWait').hide();   
});

function setPersistentOptions(){
    var marker = localStorage.getItem("marker");
    localStorage.setItem("marker", "visited");
    $(".persistent-options input[type='checkbox']").each(function(){
        var checked = (localStorage.getItem(this.id) == 'true');
        $(this).prop("checked", checked);
        if(this.id == "chemistAndDruggist") setChemistAndDruggistAction(checked);
        if(this.id == "showIllustrations" && !marker){
            $(this).prop("checked", true);   // default to illustrations
            localStorage.setItem(this.id, "true");
        }
    });
}

function setChemistAndDruggistAction(checked){
    $('#imfeelinglucky').off('click');            
    $('#imfeelinglucky').on('click', checked ? loadRandomCD : ImFeelingLucky);
}

function processQueryString(){    
    var qs = /manifest=([^\&]*)/g.exec(window.location.search);
    var page = /page=([^\&]*)/g.exec(window.location.search);
    if(page && page[1]){
        currentPage = page[1];
    }
    setPersistentOptions();
    $("input[type='checkbox']").click(function () {
        var checked = $(this).is(":checked")
        localStorage.setItem(this.id, checked);
        if(this.id == "chemistAndDruggist"){                
            setChemistAndDruggistAction(checked);
        } else {
            renderPage();
        }
    });
    if(qs && qs[1]){     
        currentManifest = qs[1];   
        $('#manifestWait').show();
        $('#title').text('loading ' + qs[1] + '...');
        $.getJSON(qs[1], function (iiifResource) {
            if(iiifResource['@type'] == "sc:Collection"){
                currentManifest = iiifResource.manifests[0]['@id'];
                $.getJSON(currentManifest, function (cManifest) {
                    load(cManifest);
                });
            } else {
                load(iiifResource);
            }
        });
    }
}

function load(manifest){   
    $('#title').text(manifest.label);
    $('#iiifManifestUri').attr("href", manifest["@id"]);
    $('#thumbViewerUri').attr("href", "thumbs.html?manifest=" + manifest["@id"]);
    if(manifest.mediaSequences){
        alert("This is not a normal IIIF manifest - it's an 'IxIF' extension for audio, video, born digital. No anno support yet!");
    } else {
        canvasList = manifest.sequences[0].canvases;
        renderPage();
    }
    $('#typeaheadWait').hide();
    $('#manifestWait').hide();
}

function loadRandomCD(){
    var manifestIndex = Math.floor(Math.random() * (6425));
    loadSuggestion({id: "b19974760-" + manifestIndex});
}


window.onpopstate = function(event) {
    if(event.state){
        currentManifest = event.state.manifest;
        currentPage = event.state.page;
        renderPage();
    }
};

function renderPage(){ 
    var nav = $('#nav');
    nav.empty();
    $('#annos').empty();
    var runningPage = -1;
    if(!canvasList) return;
    for(var i=0; i<canvasList.length; i++){
        var page = Math.floor(i / pageSize);
        console.log(page);
        if(page != runningPage){
            runningPage = page;
            var linkText = i + "-" + Math.min(i+pageSize-1, canvasList.length);
            if(i > 0) nav.append(" | ");
            if(runningPage == currentPage){
                nav.append("<strong>" + linkText + "</strong>");                
            } else {
                nav.append("<a class='pageLink' data-page='" + runningPage + "'>" + linkText + "</a>");                
            }
        }
        if(runningPage == currentPage){
            appendCanvas(i, canvasList[i]);
        }
    }    
    $('a.pageLink').click(function(){
        currentPage = $(this).attr('data-page');
        var url = "annodump.html?manifest=" + currentManifest + "&page=" + currentPage;
        history.pushState({ page: currentPage, manifest: currentManifest }, "page " + currentPage, url);
        renderPage();
    });
    $("#afterAll").empty();
    nav.clone(true, true).appendTo("#afterAll");
}

function appendCanvas(i, canvas){
    var annos = $('#annos');
    var canvasDiv = $("<div class='canvas'></div>");
    annos.append(canvasDiv);
    if(canvas.otherContent){
        $.getJSON(canvas.otherContent[0]["@id"], function(annoList){
            makeCanvasHtml(canvas, canvasDiv, annoList);
        });
    } else {
        makeCanvasHtml(canvas, canvasDiv);
    }

}

function makeCanvasHtml(canvas, canvasDiv, annoList){
    var html = "<div class='imgContainer'><a href='" + canvas.images[0].resource["@id"] + "'><img src='" + canvas.thumbnail["@id"] + "' /></a><br/>" + canvas.label + "</div>";
    if(annoList){
        html += "<div class='annoInfo'>" + annoList.resources.length + " annotations <a href='" + annoList["@id"] + "'>▷</a></div>";
        if(localStorage.getItem("showTextLines") == 'true') {
            html += getTextLines(canvas, annoList);
        }
        if(localStorage.getItem("showIllustrations") == 'true'){
            html += getIllustrations(canvas, annoList);
        }
    } else {
        html += "<p>There is no otherContent</p>";
    }
    canvasDiv.append(html);
}

function getTextLines(canvas, annoList) {
    var html = "<div class='annoInfo textLines'>";
    annoList.resources.forEach(function(res){
        if(res.motivation == "sc:painting" && res.resource["@type"] == "cnt:ContentAsText"){
            html += "<div><a target='_blank' href='" + getImageLink(canvas, res.on) + "'>" + res.resource.chars + "</a></div>";
        }
    });
    html += "</div>";
    return html;
}

function getIllustrations(canvas, annoList) {
    var html = "<div class='annoInfo illustrations'>";
    annoList.resources.forEach(function(res){
        if(res.motivation == "oa:classifying" && res.resource["@id"] == "dctypes:Image"){
            html += "<div><p>" + res.resource.label + "</p><a target='_blank' href='" + getImageLink(canvas, res.on) + "'><img src='" + getImageLink(canvas, res.on, 0.15) + "' /></a></div>";
        }
    });
    html += "</div>";
    return html;
}

function getImageLink(canvas, target, scale){
    var size = "full";
    var region = /#xywh=(.*)/g.exec(target)[1];
    if(scale && scale > 0 && scale < 1){
        
        var w = Math.floor(region.split(",")[2] * scale);
        size = w + ",";
    }
    return canvas.images[0].resource.service["@id"] + "/" + region + "/" + size + "/0/default.jpg";
}