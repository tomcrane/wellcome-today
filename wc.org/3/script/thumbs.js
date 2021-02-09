$(function() {
    makeIIIFSourceSelector();
});

function onLoadQueryStringResource(iiifResource){
    load(iiifResource);
}







function load(manifest){    
    var thumbs = $('#thumbs');
    thumbs.empty();
    $('#title').text(langMap(manifest.label));
    $('#annoDump').attr("href", "annodump.html?manifest=" + manifest.id);
    if(manifest.id.indexOf("wellcome") != -1 || manifest.id.indexOf("localhost") != -1){
        var wcManifestationId = manifest.id.split("/")[4];
        if(wcManifestationId){
            let manifestLink = "<a href='" + manifest.id + "'>manifest</a>";
            let uvLink = "<a href='http://universalviewer.io/examples/?manifest=" + manifest.id + "'>UV</a>";
            var itemPageLink = "<a href='" + manifest.homepage[0].id + "'>work page</a>";
            $('#annoDump').after(" | " + manifestLink + " | " + uvLink + " | " + itemPageLink);
            if(getSearchService(manifest))
            {
                var searchLink = "<a href='search.html?manifest=" + manifest.id + "'>search</a>";;
                $('#annoDump').after(" | " + searchLink);
            }
        }
    }
    canvasList = manifest.items;
    makeThumbSizeSelector();
    drawThumbs();
    $('#typeaheadWait').hide();
    $('#manifestWait').hide();
}






function getThumbnailSizes(canvas){
    if(canvas.thumbnail && canvas.thumbnail[0].service && canvas.thumbnail[0].service[0].sizes){
        return canvas.thumbnail[0].service[0].sizes;
    }
    return null;
}

function readAnnoLines(canvas, annoList, readBehaviour){
    linesToSpeak = [];
    textToSpeak = "";
    for(var i=0; i<annoList.items.length; i++){
        var anno = annoList.items[i];        
        if(anno.motivation == "supplementing" && anno.body.type == "TextualBody"){
            if(readBehaviour == "all"){
                textToSpeak += " ";
                textToSpeak += anno.body.value;
            } else {
                let line = {
                    text: anno.body.value,
                    lineToSpeak: new SpeechSynthesisUtterance(anno.body.value),
                    region: /#xywh=(.*)/g.exec(anno.target.id)[1]
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
        for(var i=0; i< linesToSpeak.length; i++){
            // enqueue:
            synth.speak(linesToSpeak[i].lineToSpeak);
        } 
    }
}


function getMainImg(canvas){
    var bigThumb = getParticularSizeThumb(canvas, 1024);
    if(bigThumb || assumeFullMax){
        // we need to do this again because we want to use the max path
        return canvas.thumbnail[0].service[0]["@id"] + "/full/max/0/default.jpg";
    } else {
        return canvas.items[0].items[0].body.id;
    }
}

function getImageService(canvas){
    var services = canvas.items[0].items[0].body.service[0];
    var imgService = services;
    for(var i=0; i<services.length; i++){
        // looks for image service 2
        if(typeof services[i] === "object" && services[i].profile && services[i].profile.indexOf('http://iiif.io/api/image') != -1){
            imgService = services[i];
            break;
        }
    }
    return imgService['@id'];
}















