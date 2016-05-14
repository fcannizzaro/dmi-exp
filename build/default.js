var access, asMatch, backend, config, express, isAdminAuth, isEmailAuth, isTeamAuth, isValid, payment, paypal, ranking, request, result, router, sortObject, toPayment, unlockEmails, user, utils;

user = require("./user");

payment = require("./payment");

result = require("./result");

express = require("express");

utils = require("./utils");

config = require("./config_utils");

ranking = require("./rank_utils");

request = require("request");

paypal = require('paypal-rest-sdk');

router = express.Router();

backend = config.backend;

process.on('uncaughtException', function(err) {
  return console.log('Caught exception: ' + err);
});

paypal.configure({
  'mode': 'live',
  'client_id': backend.paypal_client_id,
  'client_secret': backend.paypal_client_secret
});

router.get("/stats", function(req, res) {
  var week;
  week = utils.calcWeek(new Date());
  return user.find({}, function(err, docs) {
    var doc, i, len, paid, weekBets;
    paid = 0;
    weekBets = 0;
    for (i = 0, len = docs.length; i < len; i++) {
      doc = docs[i];
      if (doc.paid) {
        paid++;
      }
      if (doc.bets && doc.bets["week-" + week]) {
        weekBets++;
      }
    }
    return res.json({
      total: docs.length,
      paid: paid,
      week: week,
      bets: weekBets
    });
  });
});

router.get("/counter", function(req, res) {
  var now;
  now = new Date();
  now.setDate(now.getDate() + (backend.day + (7 - now.getDay())) % 7);
  now.setHours(backend.time, 0, 0);
  return res.json({
    limit: now,
    valid: isValid(new Date())
  });
});

router.get("/login", function(req, res) {
  res.locals.config = config.frontend;
  return res.render("login");
});

router.get("/season", function(req, res) {
  return result.findOne({
    week: "all"
  }, "season", function(err, doc) {
    return res.render("season", {
      season: sortObject(doc.season),
      season2014: sortObject(config.season2014)
    });
  });
});

router.get("/payment/success", function(req, res) {
  var id, payer, token;
  token = req.query.token;
  payer = req.query.PayerID;
  id = req.query.paymentId;
  if (!token || !payer || !id) {
    return res.render("payment", {
      success: false
    });
  }
  return payment.findOne({
    id: id
  }, function(err, p) {
    var options;
    if (!p) {
      return res.render("payment", {
        success: false
      });
    }
    options = {
      payer_id: payer,
      transactions: [
        {
          amount: {
            currency: "EUR",
            total: p.quote
          }
        }
      ]
    };
    return paypal.payment.execute(id, options, function(error, result) {
      if (!error) {
        return unlockEmails(p.emails, function(names) {
          return payment.findOne({
            id: id
          }, function(err, doc) {
            if (doc != null) {
              doc.success = true;
            }
            return doc.save(function(err, doc) {
              return res.render("payment", {
                success: true,
                names: names
              });
            });
          });
        });
      } else {
        return res.render("payment", {
          success: false
        });
      }
    });
  });
});

router.post("/login", function(req, res) {
  var name, token;
  token = req.body.token;
  name = req.body.name;
  if (token) {
    return request.get("https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=" + token, function(err, response, body) {
      var email;
      email = JSON.parse(body).email;
      return user.findOne({
        email: email
      }, function(err, doc) {
        if (!doc) {
          return new user({
            email: email,
            name: name
          }).save(function(err, doc) {
            if (!err) {
              access(req, doc);
            }
            return res.json({
              success: !err
            });
          });
        } else {
          access(req, doc);
          return res.json({
            success: true
          });
        }
      });
    });
  }
});

router.use(function(req, res, next) {
  var end, path, query, session;
  session = req.user || req.session.user;
  path = req.path;
  if (path.contains("pay")) {
    query = "pay";
  } else if (path.contains("season")) {
    query = "admin_season";
  } else if (path.contains("admin")) {
    query = "admin";
  }
  if (!session) {
    end = query ? "?for=" + query : "";
    return res.redirect("/login" + end);
  } else {
    return user.findOne({
      email: session.email
    }, function(err, doc) {
      req.user = doc;
      return next();
    });
  }
});

router.get("/", function(req, res) {
  var today;
  if (!req.user) {
    return res.redirect("/login");
  } else {
    today = new Date();
    return user.find({}, "-_id -email", function(err, users) {
      var matches, realUsers, week;
      week = utils.calcWeek(today);
      matches = config.matches.filter(function(m) {
        var match, w;
        m.week = utils.calcWeek(new Date(m.date));
        match = asMatch(m.home, m.opposing);
        w = "week-" + m.week;
        return m.week === week && req.user && (!req.user.bets || !req.user.bets[w] || !req.user.bets[w][match]);
      });
      realUsers = users.filter(function(person) {
        return person.paid && person.bets;
      });
      return result.findOne({
        week: "all"
      }, function(err, doc) {
        var i, key, keys, len, past, rank_cumulative, rank_euclide, ref;
        if (req.user.bets != null) {
          keys = Object.keys(req.user.bets);
        }
        rank_euclide = ranking.calcola_classifica_scoreS(realUsers, doc.results);
        rank_cumulative = ranking.calcola_classifica_scoreT(realUsers, doc.results);
        past = {};
        if (keys) {
          keys.sort();
          ref = keys.slice(0).reverse();
          for (i = 0, len = ref.length; i < len; i++) {
            key = ref[i];
            past[key] = req.user.bets[key];
          }
        }
        return res.render("dashboard", {
          user: req.user,
          active: isValid(today) ? matches : [],
          week: week,
          past: past,
          results: doc.results,
          rank_cumulative: rank_cumulative,
          rank_euclide: rank_euclide
        });
      });
    });
  }
});

router.get("/pay", function(req, res) {
  return res.render("pay");
});

isValid = function(today) {
  var day, month, ref, todayAt12;
  day = today.getUTCDate();
  month = today.getUTCMonth() + 1;
  todayAt12 = new Date("2016-" + month + "-" + day);
  todayAt12.setHours(13);
  day = today.getDay();
  return day === backend.day && today < todayAt12 || (day !== (ref = backend.day) && ref !== day) && day > 0;
};

router.get("/week", function(req, res) {
  return res.json({
    week: utils.calcWeek(new Date()) + 1
  });
});

router.get("/admin/season", function(req, res) {
  if (!isTeamAuth(req)) {
    return res.redirect("/login?for=admin_season");
  } else {
    return result.findOne({
      week: "all"
    }, "season", function(err, doc) {
      return res.render("admin-season", {
        season: sortObject(doc.season)
      });
    });
  }
});

router.get("/admin", function(req, res) {
  if (!isAdminAuth(req)) {
    return res.redirect("/login?for=admin");
  } else {
    return result.findOne({
      week: "all"
    }, function(err, doc) {
      var data, i, len, m, match, matches, week;
      matches = config.matches;
      data = {};
      for (i = 0, len = matches.length; i < len; i++) {
        m = matches[i];
        week = "week-" + utils.calcWeek(new Date(m.date));
        if (!data[week]) {
          data[week] = {};
        }
        match = asMatch(m.home, m.opposing);
        data[week][match] = doc.results[week] ? doc.results[week][match] || [] : [];
      }
      return res.render("admin", {
        matches: data
      });
    });
  }
});

router.post("/result", function(req, res) {
  var match, score, week, win;
  week = req.body.week;
  match = req.body.match;
  win = req.body.win;
  score = [0, 0, 0];
  if (!week || !match || !win || !isAdminAuth(req)) {
    return res.json({
      success: false
    });
  }
  if (win === "1") {
    score[0] = 1;
  }
  if (win === "X") {
    score[1] = 1;
  }
  if (win === "2") {
    score[2] = 1;
  }
  return result.findOne({
    week: "all"
  }, function(err, doc) {
    if (!doc.results[week]) {
      doc.results[week] = {};
    }
    if (!doc.results[week][match]) {
      doc.results[week][match] = score;
    }
    doc.markModified('results');
    return doc.save(function(err, doc) {
      return res.json({
        success: !err
      });
    });
  });
});

router.post("/team", function(req, res) {
  var op, team;
  team = req.body.team;
  op = req.body.operation;
  if (!isTeamAuth(req)) {
    return res.json({
      success: !err
    });
  } else {
    return result.findOne({
      week: "all"
    }, function(err, doc) {
      if (doc.season[team]) {
        if (op === 'V') {
          doc.season[team][0]++;
        }
        if (op === 'P') {
          doc.season[team][1]++;
        }
        if (op === 'S') {
          doc.season[team][2]++;
        }
      }
      doc.markModified('season');
      return doc.save(function(err, doc) {
        return res.json({
          success: !err
        });
      });
    });
  }
});

router.post("/bet", function(req, res) {
  var bets, match, today, value, week;
  today = new Date();
  bets = req.body.bets;
  week = utils.calcWeek(today);
  week = "week-" + week;
  if (!isValid(today || !bets || !req.user)) {
    return res.json({
      success: false
    });
  }
  if (!req.user.bets) {
    req.user.bets = {};
  }
  for (match in bets) {
    value = bets[match];
    if (!req.user.bets[week]) {
      req.user.bets[week] = {};
    }
    if (!req.user.bets[week][match]) {
      req.user.bets[week][match] = bets[match];
    }
  }
  req.user.markModified('bets');
  return req.user.save(function(err, user) {
    return res.json({
      success: !err
    });
  });
});

router.post("/pay", function(req, res) {
  var emails, quote, today, week;
  emails = req.body.emails || [];
  if (req.body.me) {
    emails.push(req.user.email);
  }
  today = new Date();
  week = utils.calcWeek(today) + 1;
  quote = week * emails.length;
  quote = quote + ".00";
  return paypal.payment.create(toPayment(quote, emails), function(error, result) {
    if (error) {
      return res.json({
        success: false
      });
    }
    if (result.payer.payment_method === "paypal") {
      return new payment({
        id: result.id,
        created: today.toString(),
        quote: quote,
        emails: emails
      }).save(function(err, doc) {
        var i, len, link, redirectUrl, ref;
        ref = result.links;
        for (i = 0, len = ref.length; i < len; i++) {
          link = ref[i];
          if (link.method === "REDIRECT") {
            redirectUrl = link.href;
          }
        }
        return res.json({
          success: true,
          redirect: redirectUrl
        });
      });
    }
  });
});

toPayment = function(quote, emails) {
  var environment;
  emails = emails.join(" , ");
  environment = process.env.ENVIRONMENT || config.environment;
  return {
    intent: "sale",
    payer: {
      payment_method: "paypal"
    },
    redirect_urls: {
      return_url: "http://" + environment + "/payment/success",
      cancel_url: "http://" + environment + "/"
    },
    transactions: [
      {
        amount: {
          total: quote,
          currency: "EUR"
        },
        description: "Progetto DMI [ " + emails + " ]"
      }
    ]
  };
};

asMatch = function(home, opposing) {
  return home + ":" + opposing;
};

sortObject = function(obj) {
  var array, i, key, len, sorted, team, value;
  array = [];
  sorted = {};
  for (key in obj) {
    value = obj[key];
    array.push([key, value]);
  }
  array.sort(function(a, b) {
    return b[1][0] - a[1][0];
  });
  for (i = 0, len = array.length; i < len; i++) {
    team = array[i];
    sorted[team[0]] = team[1];
  }
  return sorted;
};

unlockEmails = function(emails, cb) {
  var names;
  names = [];
  return user.find({
    email: {
      "$in": emails
    }
  }, function(err, docs) {
    var doc, i, len, results, size;
    size = docs.length;
    results = [];
    for (i = 0, len = docs.length; i < len; i++) {
      doc = docs[i];
      doc.paid = true;
      doc.from = utils.calcWeek(new Date());
      names.push(doc.name);
      results.push(doc.save(function(err, doc) {
        if (--size === 0) {
          return cb(names);
        }
      }));
    }
    return results;
  });
};

access = function(req, doc) {
  var hour;
  hour = 3600000;
  req.user = doc;
  req.session.user = doc;
  req.session.cookie.expires = new Date(Date.now() + hour);
  return req.session.cookie.maxAge = hour;
};

router.get("/emails", function(req, res) {
  if (isEmailAuth(req)) {
    return user.find({}, "email name", function(err, docs) {
      var doc, i, len, text;
      text = "";
      for (i = 0, len = docs.length; i < len; i++) {
        doc = docs[i];
        if (doc) {
          text += doc.email + " ";
        }
      }
      return res.send(text);
    });
  } else {
    return res(send('Not authorized'));
  }
});

isAdminAuth = function(req) {
  return config.backend.admin_auth.indexOf(req.user.email >= 0);
};

isEmailAuth = function(req) {
  return config.backend.email_auth.indexOf(req.user.email >= 0);
};

isTeamAuth = function(req) {
  return config.backend.team_auth.indexOf(req.user.email >= 0);
};

String.prototype.contains = function(str) {
  return this.indexOf(str) >= 0;
};

module.exports = router;
