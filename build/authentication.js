(function() {
  var onSignIn;

  onSignIn = function(googleUser) {
    var profile, req;
    profile = googleUser.getBasicProfile();
    req = new XMLHttpRequest();
    req.open("POST", "/login", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send("token=" + (googleUser.getAuthResponse().id_token) + "&name=" + (profile.getName()));
    return req.onreadystatechange = function() {
      var response;
      if (req.readyState === XMLHttpRequest.DONE) {
        response = JSON.parse(req.responseText);
        if (response.success) {
          return window.location = location.search === "" ? "/" : location.search.replace("?for=", "").replace(/_/g, "/");
        } else {
          return window.location = "/login";
        }
      }
    };
  };

}).call(this);
