

var canvasList;
var bigImage;
var authDo;
var assumeFullMax = false;
var viewer;
var synth = window.speechSynthesis;
var dlcsIoThumbs = "dlcs.io/thumbs/";
var dlcsIoThumbsCheck = "dlcs.io/thumbschk/";
var dlcsIoThumbsNoCheck = "dlcs.io/thumbsnochk/";

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
pop += "                     <div id=\"lineHighlight\"></div>";
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
rv += "            <img src=\"css\/spin24.gif\" id='manifestWait' \/>";
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
        prefixUrl: "openseadragon/images/"
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
        $.getJSON(qs[1], function (iiifResource) {
            if(iiifResource['@type'] == "sc:Collection"){
                $.getJSON(iiifResource.manifests[0]['@id'], function (cManifest) {
                    load(cManifest);
                });
            } else {
                load(iiifResource);
            }
        });
    }
}


function load(manifest){    
    var thumbs = $('#thumbs');
    thumbs.empty();
    $('#title').text(manifest.label);
    $('#annoDump').attr("href", "annodump.html?manifest=" + manifest["@id"]);
    if(manifest["@id"].indexOf("wellcomelibrary.org")!= -1){
        var bnum = manifest["@id"].split("/")[4];
        if(bnum){
            $('#annoDump').after(" | <a href='" + manifest["@id"] + "'>manifest</a> | <a href='http://universalviewer.io/examples/?manifest=" + manifest["@id"] + "'>UV</a> | <a href='https://wellcomelibrary.org/item/" + bnum + "'>item page</a> ");
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

function drawThumbs(){
    var thumbs = $('#thumbs');
    thumbs.empty();
    for(var i=0; i<canvasList.length; i++){
        var canvas = canvasList[i];
        var thumbHtml = '<div class="tc">' + (canvas.label || '') + '<br/>';
        var thumb = getThumb(canvas);
        if(!thumb){ 
            thumbHtml += '<div class="thumb-no-access">Image not available</div></div>';
        } else {
            // This is a temporary hack to get sizes until sorty, getThumbnail etc are unified with this
            var sizeParam = /full\/([^\/]*)\/(.*)/g.exec(thumb);
            var dimensions = "";
            if(sizeParam && sizeParam[1] && sizeParam[1].indexOf(",") > 0) {
                wh = sizeParam[1].split(",");
                dimensions = "width='" + wh[0] + "' height='" + wh[1] + "'";
            }
            thumbHtml += '<img class="thumb" title="' + canvas.label + '" data-uri="' + canvas['@id'] + '" data-src="' + thumb + '" ' + dimensions + '/></div>';
        }
        thumbs.append(thumbHtml);
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
        if(canvas.thumbnail && canvas.thumbnail.service && canvas.thumbnail.service.sizes){
            var sizes = canvas.thumbnail.service.sizes;
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

function makeThumbSourceSelector(){
    // this is an additional feature to test new thumbnail functionality in the DLCS
    // Only triggered if the first thumbnail is at /thumbs/
    // If so, this will allow the app to replace "thumbs" with alternative path segments.
    var canvas = canvasList[0];
    localStorage.removeItem('thumbPathElement');
    if(canvas.thumbnail && 
        canvas.thumbnail.service && 
        canvas.thumbnail.service.sizes &&
        canvas.thumbnail.service['@id'].indexOf(dlcsIoThumbs) > 0){

        var html = "<select id='thumbSource'>";
        html += "<option value='" + dlcsIoThumbs + "'>" + dlcsIoThumbs + "</option>";
        html += "<option value='" + dlcsIoThumbsNoCheck + "'>" + dlcsIoThumbsNoCheck + "</option>";
        html += "<option value='" + dlcsIoThumbsCheck + "'>" + dlcsIoThumbsCheck + "</option>";
        html += "</select>";
        $('#thumbSourceSelector').append(html);
        $('#thumbSourceSelector').addClass("col-md-2");
        $('#mainSearch').removeClass("col-md-10").addClass("col-md-8");
        $('#thumbSourceSelector').show();
        
        var thumbSource = localStorage.getItem('thumbSource');
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
        $('#mdlLabel').text(canvas.label);        
        if(synth && canvas.otherContent){
            $('.btn-read').attr('data-uri', canvas['@id']);
        } else {
            $('.btn-read').hide();    
        }
        if(cvIdx > 0){
            $('#mdlPrev').prop('disabled', false);
            prevCanvas = canvasList[cvIdx - 1];
            $('#mdlPrev').attr('data-uri', prevCanvas['@id']);
        } else {
            $('#mdlPrev').prop('disabled', true);
        }        
        if(cvIdx < canvasList.length - 1){
            $('#mdlNext').prop('disabled', false);
            nextCanvas = canvasList[cvIdx + 1];
            $('#mdlNext').attr('data-uri', nextCanvas['@id']);
        } else {
            $('#mdlNext').prop('disabled', true);
        }
    }
}

function readCanvas(canvasId, readBehaviour){    
    var cvIdx = findCanvasIndex(canvasId);
    var canvas = canvasList[cvIdx];    
    $.getJSON(canvas.otherContent[0]["@id"], function(annoList){
        readAnnoLines(canvas, annoList, readBehaviour);
    });
}

function readAnnoLines(canvas, annoList, readBehaviour){
    linesToSpeak = [];
    textToSpeak = "";
    for(var i=0; i<annoList.resources.length; i++){
        var res = annoList.resources[i];        
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
        if(canvasId == canvasList[idx]['@id']){
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
        let modifiedId = modifyThumbSource(canvas.thumbnail.service['@id']);
        return modifiedId + "/full/max/0/default.jpg";
    } else {
        return canvas.images[0].resource['@id'];
    }
}

function getImageService(canvas){
    var services = canvas.images[0].resource.service;
    var imgService = services;
    if(Array.isArray(services)){
        for(var i=0; i<services.length; i++){
            if(typeof services[i] === "object" && services[i].profile && services[i].profile.indexOf('http://iiif.io/api/image') != -1){
                imgService = services[i];
                break;
            }
        }
    }
    return imgService['@id'];
}

function getThumb(canvas){
    if(!canvas.thumbnail){
        return null;
    }
    if(typeof canvas.thumbnail === "string"){
        return canvas.thumbnail;
    }
    var thumb = canvas.thumbnail['@id'];
    if(canvas.thumbnail.service && canvas.thumbnail.service.sizes){
        // manifest gives thumb size hints
        // dumb version exact match and assumes ascending - TODO: https://gist.github.com/tomcrane/093c6281d74b3bc8f59d
        var particular = getParticularSizeThumb(canvas, localStorage.getItem('thumbSize'));
        if(particular) return particular;
    }
    return thumb;
}

function modifyThumbSource(imageId){
    let thumbSource = localStorage.getItem('thumbSource');
    if(thumbSource){
        return imageId.replace(dlcsIoThumbs, thumbSource);
    }
    return imageId;
}

function getParticularSizeThumb(canvas, thumbSize){
    var sizes = canvas.thumbnail.service.sizes;
    for(var i=sizes.length - 1; i>=0; i--){
        if((sizes[i].width == thumbSize || sizes[i].height == thumbSize) && sizes[i].width <= thumbSize && sizes[i].height <= thumbSize){
            let idBase = modifyThumbSource(canvas.thumbnail.service['@id']);
            return idBase + "/full/" + sizes[i].width + "," + sizes[i].height + "/0/default.jpg";
        }
    }
    return null;
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
        if (info.service.hasOwnProperty('@context')) {
            services = [info.service];
        } else {
            // array of service
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


/**
 * jQuery Unveil
 * A very lightweight jQuery plugin to lazy load images
 * http://luis-almeida.github.com/unveil
 *
 * Licensed under the MIT license.
 * Copyright 2013 Lu�s Almeida
 * https://github.com/luis-almeida
 */

; (function ($) {

    $.fn.unveil = function (threshold, callback) {

        var $v = $(".viewer"), $w = $(window),
            th = threshold || 0,
            retina = window.devicePixelRatio > 1,
            attrib = retina ? "data-src-retina" : "data-src",
            images = this,
            loaded;

        this.one("unveil", function () {
            var source = this.getAttribute(attrib);
            source = source || this.getAttribute("data-src");
            if (source) {
                console.log("setting src " + source);
                this.setAttribute("src", source);
                if (typeof callback === "function") callback.call(this);
            }
        });

        function unveil() {
            var inview = images.filter(function () {
                var $e = $(this);
                if ($e.is(":hidden")) return;

                var wt = $w.scrollTop(),
                    wb = wt + $w.height(),
                    et = $e.offset().top,
                    eb = et + $e.height();

                return eb >= wt - th && et <= wb + th;
            });

            loaded = inview.trigger("unveil");
            images = images.not(loaded);
        }

        $w.on("scroll.unveil resize.unveil lookup.unveil", unveil);
        $v.on("scroll.unveil resize.unveil lookup.unveil", unveil);

        unveil();

        return this;

    };

})(window.jQuery);
