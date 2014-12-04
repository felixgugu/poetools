File not found.

var gheaderAdded = false;
$(document).bind('DOMSubtreeModified', function(evt) {
    if (!gheaderAdded && ($('#gheader').length > 0 || $('#garenabar_bg_bg').length > 0)) {
        var height = $('#gheader').length > 0 ? $('#gheader').height() : $('#garenabar_bg_bg').height();
        gheaderAdded = true;
        var css = 'body { background-position-y: ' + height + 'px !important; }';
        var style = document.createElement('style');
        style.type = 'text/css';
        if (style.styleSheet){
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
        document.head.appendChild(style);
    }
});