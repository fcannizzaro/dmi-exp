user = require "./user"
basicAuth = require 'basic-auth'
payment = require "./payment"
result = require "./result"
express = require "express"
utils = require "./utils"
config = require "./config_utils"
ranking = require "./rank_utils"
request = require "request"
paypal = require 'paypal-rest-sdk'
router = express.Router()
backend = config.backend

process.on 'uncaughtException', (err) ->
    console.log 'Caught exception: ' + err

paypal.configure
    'mode': 'live'
    'client_id': backend.paypal_client_id
    'client_secret': backend.paypal_client_secret

# NO AUTHENTICATION REQUESTED

router.get "/stats", (req,res) ->
    week = utils.calcWeek new Date()
    user.find {} , (err,docs) ->
        paid = 0
        weekBets = 0
        for doc in docs
            paid++ if doc.paid
            weekBets++ if doc.bets && doc.bets["week-#{week}"]
        res.json
            total: docs.length
            paid: paid
            week : week
            bets : weekBets

router.get "/counter", (req, res) ->
    now = new Date()  
    now.setDate now.getDate() + (backend.day+(7-now.getDay())) % 7
    now.setHours backend.time,0,0
    res.json limit: now, valid : isValid(new Date())

router.get "/login", (req, res) ->
    res.locals.config = config.frontend
    res.render "login"

router.get "/season", (req, res) ->

    result.findOne 
        week: "all", "season", (err, doc) ->

            res.render "season", 
            season: sortObject doc.season
            season2014 : sortObject config.season2014

router.get "/payment/success", (req, res) ->

    token = req.query.token
    payer = req.query.PayerID
    id = req.query.paymentId

    return res.render "payment", success : false if !token || !payer || !id
 
    payment.findOne id: id, (err, p) ->
        
        if(!p)
            return res.render "payment", success : false

        options =
            payer_id: payer,
            transactions: [
                amount:
                    currency: "EUR"
                    total: p.quote            
            ]    

        paypal.payment.execute id, options, (error, result) ->

            if !error      
                unlockEmails p.emails, (names) ->
                    payment.findOne id: id, (err,doc) ->
                        doc.success = true if doc?
                        doc.save (err,doc) -> 
                            res.render "payment", success : true, names : names
             
            else
                res.render "payment", success : false

router.post "/login", (req, res) ->

    token = req.body.token
    name = req.body.name

    if token
        request.get "https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=#{token}", (err, response, body) ->

            email = JSON.parse(body).email

            user.findOne email: email, (err, doc) ->

                if (!doc)
                    new user
                        email: email
                        name: name     
                    .save (err, doc) ->                       
                        access req, doc if !err
                        res.json success: !err            
                else
                    access req, doc
                    res.json success: true
                
# AUTHENTICATION REQUESTED

router.use (req, res, next) ->

    session = req.user || req.session.user
    path = req.path

    if  path.contains "pay"
        query = "pay" 
    else if path.contains "season"
        query = "admin_season"
    else if path.contains "admin"
        query = "admin" 

    if !session
        end = if query then "?for=#{query}" else ""
        res.redirect "/login#{end}"
    else
        user.findOne email: session.email, (err, doc) ->
            req.user = doc
            next()

router.get "/", (req, res) ->

    if !req.user
        res.redirect "/login"
    else 

        today = new Date()

        user.find {}, "-_id -email", (err, users) ->

            week = utils.calcWeek today
            matches = config.matches.filter (m) ->
                    m.week = utils.calcWeek new Date m.date
                    match = asMatch m.home, m.opposing
                    w = "week-#{m.week}"
                    m.week is week && req.user && (!req.user.bets || !req.user.bets[w] || !req.user.bets[w][match])

            realUsers = users.filter (person) -> person.paid && person.bets

            result.findOne week: "all", (err, doc) ->

                keys = Object.keys req.user.bets if req.user.bets?
                rank_euclide = ranking.calcola_classifica_scoreS realUsers, doc.results
                rank_cumulative = ranking.calcola_classifica_scoreT realUsers, doc.results
                past = {}

                if keys
                    keys.sort()
                    for key in keys.slice(0).reverse()
                        past[key] = req.user.bets[key]    

                res.render "dashboard",
                    user: req.user
                    active: if isValid today then matches else []
                    week: week
                    past: past
                    results: doc.results
                    rank_cumulative: rank_cumulative
                    rank_euclide : rank_euclide
                
router.get "/pay", (req, res) -> 
    if req.user.paid
        res.redirect "/"
    else
        res.render "pay"

isValid = (today) -> 
    day = today.getUTCDate()
    month = today.getUTCMonth() + 1
    todayAt12 = new Date("2016-#{month}-#{day} 12:00")
    day = today.getDay()
    day < backend.day || day == backend.day && today < todayAt12

router.get "/admin/season", (req, res) ->

    if !isTeamAuth(req)
        res.redirect "/login?for=admin_season"
    else
        result.findOne week: "all", "season", (err, doc) ->
            res.render "admin-season", season: sortObject doc.season
        
router.get "/admin", (req, res) ->

    if !isAdminAuth(req)
        res.redirect "/login?for=admin"
    else
        result.findOne week: "all", (err, doc) ->

            matches = config.matches
            data = {}

            for m in matches
                week = "week-" + utils.calcWeek new Date m.date
                data[week] = {} if !data[week]
                match = asMatch m.home, m.opposing
                data[week][match] = if doc.results[week] then doc.results[week][match] || [] else [];

            res.render "admin", matches: data
         
router.post "/result", (req, res) ->

    week = req.body.week
    match = req.body.match
    win = req.body.win
    score = [0, 0, 0]

    if !week || !match || !win || !isAdminAuth(req)
        return res.json success: false   
    
    score[0] = 1 if win is "1";
    score[1] = 1 if win is "X";
    score[2] = 1 if win is "2";

    result.findOne week: "all", (err, doc) ->
        doc.results[week] = {} if !doc.results[week]
        doc.results[week][match] = score  if !doc.results[week][match]
        doc.markModified 'results'
        doc.save (err, doc) ->  res.json success: !err
      
router.post "/team", (req, res) ->

    team = req.body.team
    op = req.body.operation

    if !isTeamAuth(req)
        res.json success: !err 
    else
        result.findOne week: "all", (err, doc) ->

            if doc.season[team]                
                doc.season[team][0]++ if op is 'V'
                doc.season[team][1]++ if op is 'P'
                doc.season[team][2]++ if op is 'S'
            
            doc.markModified 'season'
            doc.save (err, doc) -> res.json success: !err

router.post "/bet", (req, res) ->

    today = new Date()
    bets = req.body.bets
    week = utils.calcWeek today
    week = "week-#{week}"

    if !isValid today || !bets || !req.user
        return res.json success: false
    
    req.user.bets = {} if !req.user.bets

    for match,value of bets     
        req.user.bets[week] = {} if !req.user.bets[week]        
        req.user.bets[week][match] = bets[match] if !req.user.bets[week][match]

    req.user.markModified 'bets'
    req.user.save (err, user) -> res.json success: !err

router.post "/pay", (req, res) ->

    emails = req.body.emails ||  []

    if req.body.me
        emails.push req.user.email

    quote = 7 * emails.length
    quote = "#{quote}.00";

    paypal.payment.create toPayment(quote, emails), (error, result) ->
            
        return res.json success: false if error   

        if result.payer.payment_method is "paypal"

            new payment
                id: result.id
                created: new Date().toString()
                quote: quote
                emails: emails

            .save (err, doc) ->
               
                for link in result.links
                    redirectUrl = link.href if link.method is "REDIRECT"

                res.json
                    success: true,
                    redirect: redirectUrl

# Utils

toPayment = (quote, emails) ->

        emails = emails.join " , "
        environment = process.env.ENVIRONMENT || config.environment

        intent: "sale"
        payer: payment_method: "paypal"        
        redirect_urls:
            return_url: "http://#{environment}/payment/success"
            cancel_url: "http://#{environment}/"
        transactions: [
            amount:
                total: quote
                currency: "EUR"            
            description: "Progetto DMI [ #{emails} ]"
        ]
    
asMatch = (home, opposing) -> "#{home}:#{opposing}"

sortObject = (obj) ->
    array = []
    sorted = {}
    for key,value of obj
        array.push [key,value]
    array.sort (a,b) -> b[1][0] - a[1][0]   
    for team in array
        sorted[team[0]] = team[1]
    sorted

unlockEmails = (emails, cb) ->

    names = []

    user.find email: "$in": emails, (err, docs) ->

        size = docs.length

        for doc in docs
            doc.paid = true
            doc.from = utils.calcWeek new Date()               
            names.push doc.name
            doc.save (err, doc) ->
                cb(names) if --size is 0

access = (req, doc) ->
    hour = 3600000
    req.user = doc
    req.session.user = doc
    req.session.cookie.expires = new Date Date.now() + hour
    req.session.cookie.maxAge = hour

router.get "/emails",   (req,res) ->
    if isEmailAuth req
        user.find {}, "email name", (err,docs) ->
            text = ""
            for doc in docs
                text += "#{doc.email} " if doc
            res.send text
    else
        res send 'Not authorized'

isAdminAuth = (req) -> config.backend.admin_auth.indexOf req.user.email >= 0;

isEmailAuth = (req) -> config.backend.email_auth.indexOf req.user.email >= 0;

isTeamAuth = (req) -> config.backend.team_auth.indexOf req.user.email >= 0;

String.prototype.contains = (str) -> this.indexOf(str) >= 0

module.exports = router