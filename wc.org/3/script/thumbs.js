function load(iiifResource){
    let thumbs = $('#thumbs');
    thumbs.empty();
    $('#title').text(langMap(iiifResource.label));

    if(iiifResource.type == "Collection"){
        $('#annoDump').after("<b>This is a IIIF Collection</b> - it contains " + iiifResource.items.length + " manifests. | <a href='" + iiifResource.id + "'>View Collection IIIF JSON</a>");
        $('#annoDump').hide();
        for(manifest of iiifResource.items){
            let manifestLink = "thumbs.html?manifest=" + manifest.id;
            let html = "<div class='manifest-in-coll'>";
            html += "<a href='" + manifestLink + "'><img src='" + manifest.thumbnail[0].id + "' /></a></h4>"
            html += "<h4><a href='" + manifestLink + "'>" + langMap(manifest.label, "<br/>") + "</a></h4>"
            html += "</div>";
            thumbs.append(html);
        }

    } else {
        let manifest = iiifResource;
        $('#annoDump').attr("href", "annodump.html?manifest=" + manifest.id);
        if(manifest.id.indexOf("wellcome") != -1 || manifest.id.indexOf("localhost") != -1){
            let wcManifestationId = manifest.id.split("/")[4];
            if(wcManifestationId){
                let manifestLink = "<a href='" + manifest.id + "'>manifest</a>";
                let uvLink = "<a href='http://universalviewer.io/examples/?manifest=" + manifest.id + "'>UV</a>";
                let itemPageLink = "<a href='" + manifest.homepage[0].id + "'>work page</a>";
                $('#annoDump').after(" | " + manifestLink + " | " + uvLink + " | " + itemPageLink);
                if(getSearchService(manifest))
                {
                    let searchLink = "<a href='search.html?manifest=" + manifest.id + "'>search</a>";
                    $('#annoDump').after(" | " + searchLink);
                }
                if(manifest.partOf){
                    for(let resource of manifest.partOf){
                        if(resource.type == "Collection" && resource.behavior && resource.behavior[0] == "multi-part"){
                            let collLink = "<a href='thumbs.html?manifest=" + resource.id + "'><b>&#8679; up to collection</b></a>";
                            $('#annoDump').after(" | " + collLink);
                        }
                    }
                }
            }
        }
        canvasList = manifest.items;
        if(canvasList[0].duration){
            // AV
            makeAVCanvases(manifest);
        } else if(canvasList[0].width) {
            // images
            makeThumbSizeSelector();
            drawThumbs();
        } else {
            // Something else...
            makeBDCanvases(manifest);
        }
    }

    $('#typeaheadWait').hide();
    $('#manifestWait').hide();
}


function makeAVCanvases(manifest){
    for(canvas of canvasList){
        let poster = "";
        if(manifest.placeholderCanvas){
            poster = manifest.placeholderCanvas.items[0].items[0].body.id;
        }
        let html = "<div class='av-canvas'>";
        let sources = "";
        let body = canvas.items[0].items[0].body;
        if(body.type == "Choice"){
            for(let choice of body.items){
                sources += "<source src='" + choice.id + "' type='" + choice.format + "'>";
            }
        } else {
            sources += "<source src='" + body.id + "' type='" + body.format + "'>";
        }
        if(canvas.width){
            html += "<video controls poster='" + poster + "'>" + sources + "</video>";
        } else {
            html += "<audio controls poster='" + poster + "'>" + sources + "</audio>";
        }
        if(canvas.annotations){
            for(anno of canvas.annotations[0].items){
                // assume only one page for now, and that we just link to the resource
                html += "<div class='av-anno'><a href='" + anno.body.id + "' target='_blank'>" + langMap(anno.body.label) + "</a></div>";
            }
        }
        html += "</div>";

        $('#thumbs').append(html);
    }
}

function makeBDCanvases(manifest){
    for(canvas of canvasList){
        let thumbnail = manifest.thumbnail[0].id;
        let html = "<div class='bd-canvas'>";
        if(canvas.annotations){
            for(anno of canvas.annotations[0].items){
                // assume only one page for now, and that we just link to the resource
                html += "<iframe src='" + anno.body.id + "'></iframe>";
            }
        }
        html += "</div>";

        $('#thumbs').append(html);
    }
}


function getThumbnailSizes(canvas){
    if(canvas.thumbnail && canvas.thumbnail[0].service && canvas.thumbnail[0].service[0].sizes){
        return canvas.thumbnail[0].service[0].sizes;
    }
    return null;
}

function readAnnoLines(canvas, annoList, readBehaviour){
    let linesToSpeak = [];
    let textToSpeak = "";
    for(let i=0; i<annoList.items.length; i++){
        let anno = annoList.items[i];
        if(anno.motivation == "supplementing" && anno.body.type == "TextualBody"){
            if(readBehaviour == "all"){
                textToSpeak += " ";
                textToSpeak += anno.body.value;
            } else {
                let line = {
                    text: anno.body.value,
                    lineToSpeak: new SpeechSynthesisUtterance(anno.body.value),
                    region: /#xywh=(.*)/g.exec(anno.target)[1]
                };                     
                linesToSpeak.push(line);
                line.lineToSpeak.onstart = function(){
                    highlightSpokenLine(line, canvas);
                }       
            }
        }
    }
    if(readBehaviour == "all"){
        synth.speak(new SpeechSynthesisUtterance(textToSpeak));
    } else {
        for(let i=0; i< linesToSpeak.length; i++){
            // enqueue:
            synth.speak(linesToSpeak[i].lineToSpeak);
        } 
    }
}


function getMainImg(canvas){
    let bigThumb = getParticularSizeThumb(canvas, 1024);
    if(bigThumb || assumeFullMax){
        // we need to do this again because we want to use the max path
        return canvas.thumbnail[0].service[0]["@id"] + "/full/max/0/default.jpg";
    } else {
        return canvas.items[0].items[0].body.id;
    }
}

function getImageService(canvas){
    let services = canvas.items[0].items[0].body.service;
    let imgService = services[0];
    for(let i=0; i<services.length; i++){
        // looks for image service 2
        if(typeof services[i] === "object" && services[i].profile && services[i].profile.indexOf('http://iiif.io/api/image') != -1){
            imgService = services[i];
            break;
        }
    }
    return imgService['@id'];
}















