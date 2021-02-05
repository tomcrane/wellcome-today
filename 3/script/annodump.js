
var canvasList;
var pageSize = 10;
var currentPage = 0;
var currentManifest = "";

$(function() {
    makeIIIFSourceSelector();
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
            load(iiifResource);
        });
    }
}

function load(manifest){   
    $('#title').text(langMap(manifest.label));
    $('#iiifManifestUri').attr("href", manifest.id);
    $('#thumbViewerUri').attr("href", "thumbs.html?manifest=" + manifest.id);
    if(manifest.homepage){
        $('#itemPageUri').attr("href", manifest.homepage[0].id);
    }
    canvasList = manifest.items;
    renderPage();
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
    if(canvas.annotations){
        $.getJSON(canvas.annotations[0].id, function(annoPage){
            makeCanvasHtml(canvas, canvasDiv, annoPage);
        });
    } else {
        makeCanvasHtml(canvas, canvasDiv);
    }

}

function makeCanvasHtml(canvas, canvasDiv, annoPage){
    var html = "<div class='imgContainer'><a href='" + canvas.items[0].items[0].body.id + "'><img src='" + getParticularSizeThumb(canvas, 100) + "' /></a><br/>" + langMap(canvas.label) + "</div>";
    if(annoPage){
        html += "<div class='annoInfo'>" + annoPage.items.length + " annotations <a href='" + annoPage.id + "'>▷</a></div>";
        if(localStorage.getItem("showTextLines") == 'true') {
            html += getTextLines(canvas, annoPage);
        }
        if(localStorage.getItem("showIllustrations") == 'true'){
            html += getIllustrations(canvas, annoPage);
        }
    } else {
        html += "<p>There is no otherContent</p>";
    }
    canvasDiv.append(html);
}


function getParticularSizeThumb(canvas, thumbSize){
    if(canvas.thumbnail[0].service  ){
        var sizes = canvas.thumbnail[0].service[0].sizes;
        sizes.sort(function(a,b){ return a - b});
        for(var i=sizes.length - 1; i>=0; i--){
            if((sizes[i].width == thumbSize || sizes[i].height == thumbSize) && sizes[i].width <= thumbSize && sizes[i].height <= thumbSize){
                return canvas.thumbnail[0].service[0]["@id"] + "/full/" + sizes[i].width + "," + sizes[i].height + "/0/default.jpg";
            }
        }
        return null;
    }
    return canvas.thumbnail[0].id;
}

function getTextLines(canvas, annoPage) {
    var html = "<div class='annoInfo textLines'>";
    annoPage.items.forEach(function(anno){
        if(anno.motivation == "supplementing" && anno.body.type == "TextualBody"){
            html += "<div><a target='_blank' href='" + getImageLink(canvas, anno.target.id) + "'>" + anno.body.value + "</a></div>";
        }
    });
    html += "</div>";
    return html;
}

function getIllustrations(canvas, annoPage) {
    var html = "<div class='annoInfo illustrations'>";
    annoPage.items.forEach(function(anno){
        if(anno.motivation == "classifying" && anno.body.id == "Image"){
            html += "<div><p>" + langMap(anno.body.label) + "</p><a target='_blank' href='" + getImageLink(canvas, anno.target.id) + "'><img src='" + getImageLink(canvas, anno.target.id, 0.15) + "' /></a></div>";
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
    return canvas.items[0].items[0].body.service[0]["@id"] + "/" + region + "/" + size + "/0/default.jpg";
}