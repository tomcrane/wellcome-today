function load(manifest){
    currentManifest = manifest;
    $('#title').text(langMap(manifest.label));
    $('#iiifManifestUri').attr("href", manifest.id);
    $('#thumbViewerUri').attr("href", "thumbs.html?manifest=" + manifest.id);
    $('#annoPageUri').attr("href", "annodump.html?manifest=" + manifest.id);
    if(manifest.id.indexOf("wellcome")!= -1){
        $('#itemPageUri').attr("href", manifest.homepage[0].id);
    }
    doSearch();
    $('#typeaheadWait').hide();
    $('#manifestWait').hide();
}



