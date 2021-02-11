$(function() {
    // no extras
});

function load(manifest){
    let thumbs = $('#thumbs');
    thumbs.empty();
    $('#title').text(manifest.label);
    $('#annoDump').attr("href", "annodump.html?manifest=" + manifest["@id"]);
    if(manifest["@id"].indexOf("wellcomelibrary.org")!= -1){
        let bnum = manifest["@id"].split("/")[4];
        if(bnum){
            let manifestLink = "<a href='" + manifest["@id"] + "'>manifest</a>";
            let uvLink = "<a href='http://universalviewer.io/examples/?manifest=" + manifest["@id"] + "'>UV</a>";
            let itemPageLink = "<a href='" + manifest.related["@id"] + "'>item page</a>";
            $('#annoDump').after(" | " + manifestLink + " | " + uvLink + " | " + itemPageLink);
            if(getSearchService(manifest))
            {
                let searchLink = "<a href='search.html?manifest=" + manifest["@id"] + "'>search</a>";;
                $('#annoDump').after(" | " + searchLink);
            }
        }
    }
    if(manifest.mediaSequences){
        thumbs.append("<i>This is not a normal IIIF manifest - it's an 'IxIF' extension for audio, video, born digital. This viewer does not support them (yet).</i>");
    } else {
        canvasList = manifest.sequences[0].canvases;
        makeThumbSizeSelector();
        makeThumbSourceSelector();
        drawThumbs();
    }
    $('#typeaheadWait').hide();
    $('#manifestWait').hide();
}

function getThumbnailSizes(canvas){
    if(canvas.thumbnail && canvas.thumbnail.service && canvas.thumbnail.service.sizes){
        return canvas.thumbnail.service.sizes;
    }
    return null;
}

function readAnnoLines(canvas, annoList, readBehaviour){
    let linesToSpeak = [];
    let textToSpeak = "";
    for(let i=0; i<annoList.resources.length; i++){
        let res = annoList.resources[i];
        if(res.motivation == "sc:painting" && res.resource["@type"] == "cnt:ContentAsText"){
            if(readBehaviour == "all"){
                textToSpeak += " ";
                textToSpeak += res.resource.chars;
            } else {
                let line = {
                    text: res.resource.chars,
                    lineToSpeak: new SpeechSynthesisUtterance(res.resource.chars),
                    region: /#xywh=(.*)/g.exec(res.on)[1]
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
        let modifiedId = modifyThumbSource(canvas.thumbnail.service['@id']);
        return modifiedId + "/full/max/0/default.jpg";
    } else {
        return canvas.images[0].resource['@id'];
    }
}

function getImageService(canvas){
    let services = canvas.images[0].resource.service;
    let imgService = services;
    if(Array.isArray(services)){
        for(let i=0; i<services.length; i++){
            if(typeof services[i] === "object" && services[i].profile && services[i].profile.indexOf('http://iiif.io/api/image') != -1){
                imgService = services[i];
                break;
            }
        }
    }
    return imgService['@id'];
}


function makeThumbSourceSelector(){
    // this is an additional feature to test new thumbnail functionality in the DLCS
    // Only triggered if the first thumbnail is at /thumbs/
    // If so, this will allow the app to replace "thumbs" with alternative path segments.
    let canvas = canvasList[0];
    localStorage.removeItem('thumbPathElement');
    if(canvas.thumbnail &&
        canvas.thumbnail.service &&
        canvas.thumbnail.service.sizes &&
        canvas.thumbnail.service['@id'].indexOf(dlcsIoThumbs) > 0){

        let html = "<select id='thumbSource'>";
        html += "<option value='" + dlcsIoThumbs + "'>" + dlcsIoThumbs + "</option>";
        html += "<option value='" + dlcsIoThumbsNoCheck + "'>" + dlcsIoThumbsNoCheck + "</option>";
        html += "<option value='" + dlcsIoThumbsCheck + "'>" + dlcsIoThumbsCheck + "</option>";
        html += "</select>";
        $('#thumbSourceSelector').append(html);
        $('#thumbSourceSelector').addClass("col-md-2");
        $('#mainSearch').removeClass("col-md-10").addClass("col-md-8");
        $('#thumbSourceSelector').show();

        let thumbSource = localStorage.getItem('thumbSource');
        if(!thumbSource){
            thumbSource = dlcsIoThumbs;
            localStorage.setItem('thumbSource', thumbSource);
        }
        if(thumbSource != dlcsIoThumbs){
            $("#thumbSource option[value='" + thumbSource + "']").prop('selected', true);
        }
        $('#thumbSource').change(function(){
            var ts =  $("#thumbSource").val();
            localStorage.setItem('thumbSource', ts);
            drawThumbs();
        });
    } else {
        $('#thumbSourceSelector').empty();
        $('#thumbSourceSelector').removeClass("col-md-2");
        $('#mainSearch').removeClass("col-md-8").addClass("col-md-10");
        $('#thumbSourceSelector').hide();
    }
}




