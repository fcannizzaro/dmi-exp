function save(week, match, result) {

    var req = new XMLHttpRequest();
    req.open("POST", "/result", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    var radio = getCheckedValue(match + "-" + week);

    if (radio)
        req.send("week=" + week + "&match=" + match + "&win=" + radio);

}

function getCheckedValue(name) {
    var radios = document.getElementsByName(name);
    for (i = 0; i < radios.length; i++)
        if (radios[i].checked)
            return radios[i].value;
    return null;
}