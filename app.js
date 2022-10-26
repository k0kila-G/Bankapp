var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var morgan = require("morgan");
var User = require("./models/User");
var nuser = require("./models/nuser");
var user2 = require("./models/transfer");
var alert = require("alert");
var flash = require("connect-flash");
var app = express();
app.set("port", 4000);
app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    key: "user_sid",
    secret: "somerandonstuffs",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000,
    },
  })
);

app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie("user_sid");
  }
  next();
});
var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect("/dashboard");
  } else {
    next();
  }
};
//for signup
app.get("/", sessionChecker, (req, res) => {
  res.redirect("/login");
});

app
  .route("/signup")
  .get(sessionChecker, (req, res) => {
    res.sendFile(__dirname + "/views/signup.html");
  })
  .post((req, res) => {
    var user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });
    user.save((err, docs) => {
      if (err) {
        console.log(err);
        res.redirect("/signup");
      } else {
        console.log(docs);
        req.session.user = docs;
        res.redirect("/dashboard");
      }
    });
  });

//for login

app
  .route("/login")
  .get(sessionChecker, (req, res) => {
    res.sendFile(__dirname + "/views/login.html");
  })
  .post(async (req, res) => {
    var username = req.body.username,
      password = req.body.password;

    try {
      var user = await User.findOne({ username: username }).exec();
      if (!user) {
        res.redirect("/signup");
      }
      user.comparePassword(password, (error, match) => {
        if (!match) {
          res.redirect("/signup");
        }
      });
      req.session.user = user;
      res.redirect("/dashboard");
    } catch (error) {
      console.log(error);
    }
  });

//for dashboard

app.get("/dashboard", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/views/dashboard.html");
  } else {
    res.redirect("/login");
  }
});

//for createaccount

app
  .route("/createaccount")
  .get((req, res) => {
    res.sendFile(__dirname + "/views/createaccount.html");
  })
  .post((req, res) => {
    var user = new nuser({
      nusername: req.body.nusername,
      nemail: req.body.nemail,
      mobile: req.body.mobile,
      amount: req.body.amount,
    });
    user.save((err, docs) => {
      if (err) {
        console.log(err);
        req.flash("account created faild", "faild");
      } else {
        alert("account created successfully", "success");
      }
    });
  });

//viewuser

app.get("/viewuser", (req, res) => {
  const allData = nuser.find({});
  allData.exec((err, docs) => {
    if (err) {
      throw err;
    } else {
      res.render("viewuser", { title: "View Users", docs: docs });
    }
  });
});

// Transfer

app.get("/transact/:id", (req, res) => {
  const id = req.params.id;
  const Sender = nuser.find({ _id: id });
  const allUser = nuser.find({});
  Sender.exec((err, uData) => {
    if (err) {
      throw err;
    } else {
      allUser.exec((err, rData) => {
        if (err) {
          throw err;
        } else {
          res.render("transact", {
            title: "view",
            docs: uData,
            records: rData,
          });
        }
      });
    }
  });
});

app.post("/transact", (req, res) => {
  const {
    SenderID,
    SenderName,
    SenderEmail,
    receiverName,
    receiverEmail,
    transferAmount,
  } = req.body;
  // console.log(transferAmount);
  const user = new user2({
    sName: SenderName,
    sEmail: SenderEmail,
    rName: receiverName,
    rEmail: receiverEmail,
    amount: transferAmount,
  });
  user.save((err, docs) => {
    if (err) {
      console.log(err);
      alert("transact faild");
    } else {
      alert("transact success");
    }
  });

  if (
    receiverName === "Select Receiver Name" ||
    receiverEmail === "Select Receiver Email"
  ) {
    alert("all fields required");
  } else {
    const Sender = nuser.find({ _id: SenderID });
    const Receiver = nuser.find({ name: receiverName, email: receiverEmail });

    Promise.all([Sender, Receiver])
      .then(([senderData, receiverData]) => {
        senderData.forEach(async (c) => {
          if (
            c.name === receiverName ||
            c.email === receiverEmail ||
            c.amount < transferAmount
          ) {
            alert("Process Not Complete due to incorrect reciver details!");
          } else {
            let updateAmount = parseInt(c.amount) - parseInt(transferAmount);
            console.log(updateAmount, ">>>>>>>>>>>>>>>>");
            await nuser.findOneAndUpdate(
              { nusername: SenderName },
              { $set: { amount: updateAmount } }
            );
            user
              .save()
              .then((r) => {})
              .catch((err) => {
                console.log(err);
              });

            receiverData.forEach(async (e) => {
              let updateAmount = parseInt(e.amount) + parseInt(transferAmount);
              console.log(updateAmount, "kkkkk");
              await nuser.findOneAndUpdate(
                { nusername: receiverName },
                { $set: { amount: updateAmount } }
              );
              // user
              //   .save()
              //   .then((r) => {})
              //   .catch((err) => {
              //     console.log(err);
              //   });
            });
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//transhistory
app.get("/transactionhistory", (req, res) => {
  const allData = user2.find({});
  allData.exec((err, docs) => {
    if (err) {
      throw err;
    } else {
      res.render("transactionhistory", { title: "transhistory", docs: docs });
    }
  });
});

//logout
app.get("/logout", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie("user_sid");

    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.use(function (err, res, next) {
  console.log(err);
  res.send(err);
});

app.listen(app.get("port"), () =>
  console.log(`App started on port ${app.get("port")}`)
);
