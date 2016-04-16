onSignIn = (googleUser) ->
    profile = googleUser.getBasicProfile()
    req = new XMLHttpRequest()
    req.open "POST", "/login", true
    req.setRequestHeader "Content-type", "application/x-www-form-urlencoded"
    req.send "token=#{googleUser.getAuthResponse().id_token}&name=#{profile.getName()}"
    req.onreadystatechange = () ->
        if req.readyState is XMLHttpRequest.DONE
            response = JSON.parse req.responseText
            if response.success
                return window.location = if location.search is "" then "/" else  location.search.replace("?for=", "").replace(/_/g, "/")
            else
               return window.location = "/login"

