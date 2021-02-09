let lastLoadedManifest;

$(function() {
    $('#imfeelinglucky').on('click', ImFeelingLucky);
    $('#schBox').typeahead({
            minLength: 4,
            highlight: true
        },
        {
            name: 'flat-manifs',
            source: getFlatManifestations,
            async: true,
            limit: 50,
            display: formatFlatManifestation
        });
    $('#schBox').bind('typeahead:select', function(ev, suggestion) {
        loadSuggestion(suggestion);
    });
    $('#schBox').bind('typeahead:asyncrequest', function(ev) {
        $('#typeaheadWait').show();
    });
    $('#schBox').bind('typeahead:render', function(ev) {
        $('#typeaheadWait').hide();
    });
});