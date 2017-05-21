
var tocsdiv = $('#tocs');

$(function() {
    var qs = /src=([^\&]*)/g.exec(window.location.search);
    if(qs && qs[1]){
        webfacet = '/collections/browse/';
        iiifcoll = '/service/collections/';
        coll = qs[1]
        if(coll.indexOf(webfacet) > 0){
            coll = coll.replace(webfacet, iiifcoll)
        }
        pos = coll.indexOf(iiifcoll);
        if(pos > 0){
            path = coll.substring(pos)
            if(path.split('/').filter(Boolean).length == 4){
                loadColl(coll);
                return;
            }
        }
    }
    $('#tf').append("<div class='alert alert-danger' role='alert'>I need a 'src' parameter on the query string that is either a Wellcome browse page or a Wellcome IIIF collection, and corresponds to a collection of manifests rather than a collection of collections.</div>");
});

function loadColl(colluri){
    $.getJSON(colluri, function (coll) {
        $("#title").text("TOCs for collection - " + coll.label);
        for(mi = 0; mi< coll["manifests"].length && mi < 10; mi++){            
            $.getJSON(coll["manifests"][mi]["@id"], function (manifest) {
                if(manifest["structures"]){
                    var tocRanges = manifest["structures"].filter(function(r){
                        return r.label == "Table of Contents";
                    });
                    if(tocRanges.length > 0){
                        canvases = [];
                        for(tr of tocRanges){
                            canvases = canvases.concat(tr.canvases);
                        }                        
                        renderTocs(manifest, canvases);
                    }
                }
            });            
        }
    });
}

function renderTocs(manifest, tocCanvases){    
    var tocdiv = $("<div class='toc'><h3>" + manifest.label + "</h3></div>");
    tocsdiv.append(tocdiv);
    for(i = 0; i<tocCanvases.length; i++){
        var cvid = tocCanvases[i];
        canvas = manifest.sequences[0].canvases.filter(function(cv){
            return cv["@id"] == cvid;
        })[0];
        $.getJSON(canvas.otherContent[0]["@id"], function(annoList){
            makeCanvasHtml(manifest, tocdiv, annoList);
        });
    }
}

function makeCanvasHtml(manifest, canvasDiv, annoList){
    if(annoList && annoList.resources && annoList.resources.length > 0){
        var cvid = annoList.resources[0].on.split("#")[0];
        var canvas = manifest.sequences[0].canvases.filter(function(cv){
            return cv["@id"] == cvid;
        })[0];
        var html = "";
        // html +="<div><pre>" + JSON.stringify(canvas) + "</pre></div><hr/>";
        html += "<div class='imgContainer'><a href='" + canvas.images[0].resource["@id"] + "'><img src='" + canvas.thumbnail["@id"] + "' /></a><br/>" + canvas.label + "</div>";
        html += getTextLines(manifest, annoList);
        canvasDiv.append(html);
    }
}


function getTextLines(manifest, annoList) {
    // what cv index is this?
    var template = manifest.related["@id"] + "#?c=0&m=0&s=0&cv=";
    var html = "<div class='annoInfo textLines'>";
    annoList.resources.forEach(function(res){
        if(res.motivation == "sc:painting" && res.resource["@type"] == "cnt:ContentAsText"){
            html += "<div>" + linkPageLabels(manifest, template, res.resource.chars) + "</div>";
        }
    });
    html += "</div>";
    return html;
}

function linkPageLabels(manifest, template, text){
    var m = /(\d+)(?!.*\d)/g.exec(text);
    if(m && m[1]){
        label = m[1];
        canvasIdx = findCanvasIDFromPageLabel(manifest, label);
        if(canvasIdx > -1){
            pos = text.lastIndexOf(label);
            link = template + canvasIdx;
            anchor = "<a href='" + link + "' target='_blank'>" + label + "</a>";
            return text.slice(0, pos) + anchor + text.slice(pos+label.length);
        }
    }
    return text;
}

function findCanvasIDFromPageLabel(manifest, label){
    for(cvidx = 0; cvidx<manifest.sequences[0].canvases.length; cvidx++){
        if(manifest.sequences[0].canvases[cvidx]["label"] == label){
            return cvidx;
        }
    }
    return -1;
}

