
var canvasList;
var bigImage;
var authDo;
var assumeFullMax = false;
var viewer;
var synth = window.speechSynthesis;

var pop="";
pop += "<div class=\"modal fade\" id=\"imgModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"mdlLabel\">";
pop += "    <div class=\"modal-dialog modal-lg\" role=\"document\">";
pop += "        <div class=\"modal-content\">";
pop += "            <div class=\"modal-header\">";
pop += "                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;<\/span><\/button>";
pop += "                <h4 class=\"modal-title\" id=\"mdlLabel\"><\/h4>";
pop += "            <\/div>";
pop += "            <div class=\"modal-body\">            ";
pop += "                <div id=\"imgContainer\">";
pop += "                     <img id=\"bigImage\" class=\"img-responsive osd\" \/>";
pop += "                     <div id=\"lineHighlight\" class=\"lineHighlight\"></div>";
pop += "                </div>";
pop += "                <div id=\"viewer\" class=\"osd-viewer\"></div>";
pop += "                <div class=\"auth-ops\" id=\"authOps\">";
pop += "                    <h5>Header<\/h5>";
pop += "                    <div class=\"auth-desc\">";
pop += "                    <\/div>";
pop += "                    <button id=\"authDo\" type=\"button\" class=\"btn btn-primary\"><\/button>";
pop += "                <\/div>";
pop += "            <\/div>";
pop += "            <div class=\"modal-footer\">";
pop += "                <button id=\"mdlRead\" type=\"button\" class=\"btn btn-info pull-left btn-read\" data-uri=\"\" data-cta=\"Read All\" data-ctia=\"Cancel\" data-read=\"all\"> <\/button>";
pop += "                <button id=\"mdlReadLines\" type=\"button\" class=\"btn btn-info pull-left btn-read\" data-uri=\"\" data-cta=\"Read Lines\" data-ctia=\"Cancel\" data-read=\"lines\"> <\/button>";
pop += "                <button id=\"mdlPrev\" type=\"button\" class=\"btn btn-primary btn-prevnext\" data-uri=\"\">Prev<\/button>";
pop += "                <button id=\"mdlNext\" type=\"button\" class=\"btn btn-primary btn-prevnext\" data-uri=\"\">Next<\/button>";
pop += "            <\/div>";
pop += "        <\/div>";
pop += "    <\/div>";
pop += "<\/div>";

document.write(pop);

var rv="";
rv += "<div class=\"row viewer\">";
rv += "    <div class=\"col-md-12 iiif\">";
rv += "        <h3 id=\"title\"><\/h3>";
rv += "        <a href=\"\" id=\"annoDump\">view text and images<\/a>";
rv += "        <div id=\"thumbs\">";
rv += "            <img src=\"..\/css\/spin24.gif\" id='manifestWait' \/>";
rv += "        <\/div>";
rv += "    <\/div>";
rv += "<\/div>";
rv += "";
rv += "<footer>";
rv += "    <hr \/>";
rv += "    <p>Thumbnail viewer<\/p>";
rv += "<\/footer>";

function setGlyph($btn, glyph, text){
    $btn.html("<span class=\"glyphicon glyphicon-" + glyph + "\" aria-hidden=\"true\"></span> " + text);
}

function stopSpeaking(){
    if(synth){
        synth.cancel();
        $(".btn-read").each(function(){ 
            setGlyph($(this), "volume-up", $(this).attr('data-cta')); 
        });
    }
}

$(function() {
    makeIIIFSourceSelector();
    $('#mainContainer').append(rv);
    processQueryString();    
    $('#manifestWait').hide();
    $('#authOps').hide();
    $('.modal-footer').show();
    $('button.btn-prevnext').click(function(){
        stopSpeaking();
        canvasId = $(this).attr('data-uri');
        selectForModal(canvasId, $("img.thumb[data-uri='" + canvasId + "']"));
    });
    $(".btn-read").each(function(){ 
        setGlyph($(this), "volume-up", $(this).attr('data-cta')); 
    });
    $('.btn-read').click(function(){
        $("#lineHighlight").hide();
        if(synth && synth.speaking){
            stopSpeaking();
        } else {
            canvasId = $(this).attr('data-uri');
            $(".btn-read").each(function(){ 
                setGlyph($(this), "volume-off", $(this).attr('data-ctia')); 
            });
            readCanvas(canvasId, $(this).attr('data-read'));
        }
    });
    $('#imgModal').on('hidden.bs.modal', function () {
        stopSpeaking();
    })
    bigImage = $('#bigImage');
    bigImage.bind('error', function (e) {
        attemptAuth($(this).attr('data-uri'));
    });
    bigImage.bind('click', function (e) {
        launchOsd($(this).attr('data-uri') + "/info.json");
    });
    authDo = $('#authDo');
    authDo.bind('click', doClickthroughViaWindow);
});

function launchOsd(info){
    // fetch the info.json ourselves so we can ignore HTTP errors from
    // clickthrough auth. This is a cheat for clickthrough.
    var $osdElement = $("#viewer");
    if(viewer){
        viewer.destroy();
        viewer = null;
    }
    viewer = OpenSeadragon({
        element: $osdElement[0],
        prefixUrl: "../openseadragon/images/"
    });
    viewer.addHandler("full-screen", function(ev){
        if (!ev.fullScreen) {
            $osdElement.hide();
            bigImage.show();
        }
    });

    $osdElement.show();
    bigImage.hide();
    viewer.setFullScreen(true);

    doInfoAjax(info, loadTileSource);
}

function loadTileSource(jqXHR, textStatus) {
    var infoJson = $.parseJSON(jqXHR.responseText);
    // TODO - if we have an access token, fetch the 
    // info.json ourselves (with Authorisation header) and pass to OSD
    viewer.addTiledImage({
        tileSource: infoJson
    });
}



function processQueryString(){    
    var qs = /manifest=(.*)/g.exec(window.location.search);
    if(qs && qs[1]){        
        $('#manifestWait').show();
        $('#title').text('loading ' + qs[1] + '...');
        lastLoadedManifest = qs[1];
        $.getJSON(lastLoadedManifest, function (iiifManifest) {
            load(iiifManifest);
        });
    }
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

function drawThumbs(){
    let thumbs = $('#thumbs');
    thumbs.empty();
    let thumbSize = localStorage.getItem('thumbSize');
    for(let i=0; i<canvasList.length; i++){
        thumbs.append(getThumbHtml(canvasList[i], thumbSize));
    } 
    $('img.thumb').click(function(){
        selectForModal($(this).attr('data-uri'), $(this));
        $('#imgModal').modal();
    });
    $("img.thumb").unveil(300);
}

function makeThumbSizeSelector(){
    thumbSizes = [];
    for(var i=0; i<Math.min(canvasList.length, 10); i++){
        var canvas = canvasList[i];
        if(canvas.thumbnail && canvas.thumbnail[0].service && canvas.thumbnail[0].service[0].sizes){
            var sizes = canvas.thumbnail[0].service[0].sizes;
            for(var j=0; j<sizes.length;j++){
                var testSize = Math.max(sizes[j].width, sizes[j].height);
                if(thumbSizes.indexOf(testSize) == -1 && testSize <= 600){
                    thumbSizes.push(testSize);
                }
            }    
        }
    }
    thumbSizes.sort(function(a, b) { return a - b; });
    if(thumbSizes.length > 1){
        var html = "<select id='thumbSize'>";
        for(var i=0; i< thumbSizes.length; i++){
            html += "<option value='" + thumbSizes[i] + "'>" + thumbSizes[i] + " pixels</option>";
        }
        html += "</select>";
        $('#thumbSizeSelector').append(html);
        var thumbSize = localStorage.getItem('thumbSize');
        if(!thumbSize){
            thumbSize = thumbSizes[0];
            localStorage.setItem('thumbSize', thumbSize);
        }
        if(thumbSize != thumbSizes[0]){
            $("#thumbSize option[value='" + thumbSize + "']").prop('selected', true);
        }
        $('#thumbSize').change(function(){
            var ts =  $("#thumbSize").val();
            localStorage.setItem('thumbSize', ts);
            drawThumbs();
        });
    }
}



function selectForModal(canvasId, $image) {
    if(synth) synth.cancel();
    $("#lineHighlight").hide();
    $('img.thumb').css('border', '2px solid white');
    $image.css('border', '2px solid tomato');
    var cvIdx = findCanvasIndex(canvasId);
    if(cvIdx != -1){
        var canvas = canvasList[cvIdx];
        var imgToLoad = getMainImg(canvas);
        bigImage.show();
        bigImage.attr('src', imgToLoad); // may fail if auth
        bigImage.attr('data-src', imgToLoad); // to preserve
        bigImage.attr('data-uri', getImageService(canvas));
        $('#mdlLabel').text(langMap(canvas.label));        
        if(synth && canvas.annotations){
            $('.btn-read').attr('data-uri', canvas.id);
        } else {
            $('.btn-read').hide();    
        }
        if(cvIdx > 0){
            $('#mdlPrev').prop('disabled', false);
            prevCanvas = canvasList[cvIdx - 1];
            $('#mdlPrev').attr('data-uri', prevCanvas.id);
        } else {
            $('#mdlPrev').prop('disabled', true);
        }        
        if(cvIdx < canvasList.length - 1){
            $('#mdlNext').prop('disabled', false);
            nextCanvas = canvasList[cvIdx + 1];
            $('#mdlNext').attr('data-uri', nextCanvas.id);
        } else {
            $('#mdlNext').prop('disabled', true);
        }
    }
}

function readCanvas(canvasId, readBehaviour){    
    var cvIdx = findCanvasIndex(canvasId);
    var canvas = canvasList[cvIdx];    
    $.getJSON(canvas.annotations[0].id, function(annoList){
        readAnnoLines(canvas, annoList, readBehaviour);
    });
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

function highlightSpokenLine(line, canvas){
    // get the box on bigImage
    var scaleFactor = bigImage[0].clientWidth / canvas.width;
    var xywh = line.region.split(",");
    var stylePos = ["left", "top", "width", "height"];
    var offsets = [bigImage[0].offsetLeft, bigImage[0].offsetTop, 0, 0];
    var hl = $("#lineHighlight");
    xywh.map(function(val, idx){
        hl.css(stylePos[idx], (val*scaleFactor + offsets[idx]) + "px");
    });
    hl.show();
}

function findCanvasIndex(canvasId){
    for(idx = 0; idx < canvasList.length; idx++){
        if(canvasId == canvasList[idx].id){
            return idx;
        }
    }
    return -1;
}

function getMainImg(canvas){
    // we still have some Wellcome images with 1000px thumbs, needs tidying
    // this doesn't work because we don't know about 1024 in the manifest, that's always 1024
    // return getParticularSizeThumb(canvas, 1024) || getParticularSizeThumb(canvas, 1000) || canvas.images[0].resource['@id'];

    // so instead
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


function attemptAuth(imageService){
    imageService += "/info.json";
    doInfoAjax(imageService, on_info_complete);
}


function doInfoAjax(uri, callback, token) {
    var opts = {};
    opts.url = uri;
    opts.complete = callback;
    if (token) {
        opts.headers = { "Authorization": "Bearer " + token.accessToken }
        opts.tokenServiceUsed = token['@id'];
    }
    $.ajax(opts);
}

function reloadImage(){    
    bigImage.show();
    bigImage.attr('src', bigImage.attr('data-src') + "#" + new Date().getTime());
}

function on_info_complete(jqXHR, textStatus) {

    var infoJson = $.parseJSON(jqXHR.responseText);
    var services = getServices(infoJson);
    // leave out degraded for Wellcome for now

    if (jqXHR.status == 200) {
        // with the very simple clickthrough we shouldn't get back here unless there's a non-auth issue (eg 404, 500)
        // when this is reintroduced, need to handle the error on image - if it's not because of auth then reloading the image, 404, infinite loop.

        // reloadImage();
        // if (services.login && services.login.logout) {
        //     authDo.attr('data-login-or-out', services.login.logout.id);
        //     authDo.attr('data-token', services.login.token.id);
        //     changeAuthAction(services.login.logout.label);
        // }
        return;
    }

    if (jqXHR.status == 403) {
        alert('TODO... 403');
        return;
    }

    if (services.clickthrough) {
        bigImage.hide();
        authDo.attr('data-token', services.clickthrough.token.id);
        authDo.attr('data-uri', services.clickthrough.id);
        $('#authOps').show();
        $('.modal-footer').hide();
        $('#authOps h5').text(services.clickthrough.label);
        $('#authOps div').html(services.clickthrough.description);
        authDo.text(services.clickthrough.confirmLabel);
    }
    else {
        alert('only clickthrough supported from here');
    }
}

function doClickthroughViaWindow(ev) {

    var authSvc = $(this).attr('data-uri');
    var tokenSvc = $(this).attr('data-token');
    console.log("Opening click through service - " + authSvc + " - with token service " + tokenSvc);
    var win = window.open(authSvc); //
    var pollTimer = window.setInterval(function () {
        if (win.closed) {
            window.clearInterval(pollTimer);
            if (tokenSvc) {                
                // on_authed(tokenSvc);
                $('#authOps').hide();
                $('.modal-footer').show();
                reloadImage(); // bypass token for now
            }
        }
    }, 500);
}

function getServices(info) {
    var svcInfo = {};
    var services;
    console.log("Looking for auth services");
    if (info.hasOwnProperty('service')) {
        if(!Array.isArray(info.service)){
            services = [info.service];
        } else {
            services = info.service;
        }
        var prefix = 'http://iiif.io/api/auth/0/';
        var clickThrough = 'http://iiif.io/api/auth/0/login/clickthrough';
        for (var service, i = 0; (service = services[i]) ; i++) {
            var serviceName;

            if (service['profile'] == clickThrough) {
                serviceName = 'clickthrough';
                console.log("Found click through service");
                svcInfo[serviceName] = {
                    id: service['@id'],
                    label: service.label,
                    description: service.description,
                    confirmLabel: "Accept terms and Open" // fake this for now
                };
            }
            else if (service['profile'].indexOf(prefix) === 0) {
                serviceName = service['profile'].slice(prefix.length);
                console.log("Found " + serviceName + " auth service");
                svcInfo[serviceName] = { id: service['@id'], label: service.label };

            }
            if (service.service && serviceName) {
                for (var service2, j = 0; (service2 = service.service[j]) ; j++) {
                    var nestedServiceName = service2['profile'].slice(prefix.length);
                    console.log("Found nested " + nestedServiceName + " auth service");
                    svcInfo[serviceName][nestedServiceName] = { id: service2['@id'], label: service2.label };
                }
            }
        }
    }
    return svcInfo;
}
