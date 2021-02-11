let pageSize = 10;
let currentPage = 0;
let currentManifest = "";

$(function() {
    makeIIIFSourceSelector();
    processQueryString();    
    $('#manifestWait').hide();   
});


function load(manifest){
    currentManifest = manifest.id;
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
        if(anno.motivation == "classifying" && anno.body.id.includes("Image")){
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