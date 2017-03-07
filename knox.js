function listTables() {
    var req = new XMLHttpRequest();
    req.onerror = function() {};
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200 && !/KnoxSSO - Sign In/.test(req.responseText)) {
            document.getElementById("tables").innerHTML = req.responseText;
            hide(document.getElementById('login'));
        }
    };

    req.open("get", getWebHBaseURL() + "/", true, null, null);
    req.setRequestHeader('Content-Type', 'application/json');
    req.withCredentials = true;
    req.send(null);
}

function hide(elements, specifiedDisplay) {
    var computedDisplay, element, index;

    elements = elements.length ? elements : [elements];
    for (index = 0; index < elements.length; index++) {
        element = elements[index];
        element.style.display = '';
        element.style.display = 'none';
    }
}

function getWebHBaseURL() {
    var topo = getParameterByName("topology");
    return "https://" + topo + "hbase";
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
