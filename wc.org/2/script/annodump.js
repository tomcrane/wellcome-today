let pageSize = 10;
let currentPage = 0;
let currentManifest = "";

$(function() {

    processQueryString();    
    $('#manifestWait').hide();   
});


function load(manifest){
    currentManifest = manifest["@id"];
    $('#title').text(manifest.label);
    $('#iiifManifestUri').attr("href", manifest["@id"]);
    $('#thumbViewerUri').attr("href", "thumbs.html?manifest=" + manifest["@id"]);
    if(isWellcomeManifest(manifest)){
        $('#itemPageUri').attr("href", manifest.related["@id"]);
    }
    if(manifest.mediaSequences){
        alert("This is not a normal IIIF manifest - it's an 'IxIF' extension for audio, video, born digital. No anno support yet!");
    } else {
        canvasList = manifest.sequences[0].canvases;
        renderPage();
    }
    $('#typeaheadWait').hide();
    $('#manifestWait').hide();
}




function makeCanvasHtml(canvas, canvasDiv, annoList){
    var html = "<div class='imgContainer'><a href='" + canvas.images[0].resource["@id"] + "'><img src='" + getParticularSizeThumb(canvas, 100) + "' /></a><br/>" + canvas.label + "</div>";
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