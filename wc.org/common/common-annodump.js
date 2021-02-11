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
        $('#manifestWait').show();
        $('#title').text('loading ' + qs[1] + '...');
        $.getJSON(qs[1], function (iiifResource) {
            onLoadQueryStringResource(iiifResource)
        });
    }
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
    let annotationPage = canvas.annotations || canvas.otherContent;
    if(annotationPage){
        let annotationPageUrl = annotationPage[0]["@id"] || annotationPage[0].id;
        $.getJSON(annotationPageUrl, function(annoPage){
            makeCanvasHtml(canvas, canvasDiv, annoPage);
        });
    } else {
        makeCanvasHtml(canvas, canvasDiv);
    }
}