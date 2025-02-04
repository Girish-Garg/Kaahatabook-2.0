const express = require("express");
const app = express();
const debug = require("debug")("dev:express");
const mongooseConnect = require("./config/mongoose");
const user = require("./models/user.model");
const hisaab = require("./models/hisaab.model");
const allHisaab = require("./models/allHisaab.model");
const session = require("express-session");
const moment = require("moment");

require('dotenv').config();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "Girish@1",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 60 * 60 * 1000,
    },
  })
);

app.get("/", (req, res) => {
  res.render("logSign");
});

app.get("/signup", (req, res) => {
  res.render("signup", { query: req.query });
});

app.post("/signup", async (req, res) => {
  try {
    const foundUser = await user.findOne({
      email: req.body.email.trim(),
    });
    if (!foundUser) {
      if (req.body.password.length < 8) {
        return res.redirect("/signup?error=small-pass");
      }
      await user.create({
        email: req.body.email,
        password: req.body.password.trim(),
      });
      const createdUser = await user.findOne({
        email: req.body.email,
      });
      req.session.userId = createdUser._id;
      return res.redirect("/dashboard");
    }
    return res.redirect("/login?error=already-in");
  } catch (err) {
    console.error(err);
    res.redirect("/signup?error=true");
  }
});

app.get("/login", (req, res) => {
  res.render("login", { query: req.query });
});

app.post("/login", async (req, res) => {
  try {
    const foundUser = await user.findOne({
      email: req.body.email,
    });
    if (!foundUser) {
      return res.status(404).redirect("/signup?error=no-account");
    }
    if (foundUser.password === req.body.password) {
      req.session.userId = foundUser._id;
      return res.redirect("/dashboard");
    }
    return res.status(401).redirect("/login?error=invalid-credentials");
  } catch (err) {
    console.error(err);
    return res.status(500).redirect("/login?error=true");
  }
});

app.get("/dashboard", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }

  try {
    let hisaabaa = await hisaab.find({ user: req.session.userId });
    let all = await allHisaab.findOne({ user: req.session.userId });
    if (!all) {
      all = await allHisaab.create({
        user: req.session.userId,
        hisaabs: hisaabaa,
      });
    } else {
      all.hisaabs = hisaabaa;
      await all.save();
    }
    res.render("dashboard", { datas: all.hisaabs });
  } catch (error) {
    console.error("Error fetching hisaabs or creating AllHisaab:", error);
    res.status(500).send("Internal server error");
  }
});

app.post("/dashboard", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }
  try {
    let hisaabaa;
    if (typeof req.body.date == "string" && req.body.date !== "") {
      const dateString = req.body.date;
      const formattedDate = moment(dateString, "YYYY-MM-DD").format(
        "DD-MM-YYYY"
      );
      console.log(formattedDate);
      hisaabaa = await hisaab.find({
        user: req.session.userId,
        date: formattedDate,
      });
    } else {
      hisaabaa = await hisaab.find({ user: req.session.userId });
    }
    if (req.body.ON == "old") {
      hisaabaa.reverse();
    }
    let all = await allHisaab.findOne({ user: req.session.userId });
    if (!all) {
      all = await allHisaab.create({
        user: req.session.userId,
        hisaabs: hisaabaa,
      });
    } else {
      all.hisaabs = hisaabaa;
      await all.save();
    }
    res.render("dashboard", { datas: all.hisaabs });
  } catch (error) {
    console.error("Error fetching hisaabs or creating AllHisaab:", error);
    res.status(500).send("Internal server error");
  }
});

app.get("/create", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }
  res.render("create");
});

app.post("/create", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/");
    }
    const { title, content, isEncrypted, encryptPass, isShareable, isEditable } = req.body;
    await hisaab.create({
      title: title.trim(),
      content: content.trim(),
      isEncrypted: isEncrypted === "on",
      encryptPass: encryptPass.trim(),
      isShareable: isShareable === "on",
      isEditable: isEditable === "on",
      user: req.session.userId,
    });
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error creating hisaab:", error);
    res.status(500).send("Internal server error");
  }
});

app.get("/view/:id", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }
  let all = await allHisaab.findOne({ user: req.session.userId });
  let arrHisaab = all.hisaabs;
  const data = arrHisaab.find((one) => one._id.toString() === req.params.id);
  res.render("view", { data, query: req.query });
});

app.get("/delete/:id", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }
  try {
    let deletedHissab = await hisaab.findOneAndDelete({ _id: req.params.id });
    if (!deletedHissab) {
      return res.send("Hissab not found");
    }
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    res.send("Server Error");
  }
});

app.get("/edit/:id", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }
  try {
    let data = await hisaab.findOne({ _id: req.params.id });
    res.render("edit", { data });
  } catch (error) {
    console.log(error);
    res.send("Server Error");
  }
});

app.post("/edit/:id", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }
  try {
    await hisaab.findOneAndUpdate(
      { _id: req.params.id },
      {
        title: req.body.title.trim(),
        content: req.body.content.trim(),
        isEncrypted: req.body.isEncrypted === "on",
        encryptPass: req.body.encryptPass.trim(),
        isShareable: req.body.isShareable === "on",
        isEditable: req.body.isEditable === "on",
      }
    );
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    res.send("Server Error");
  }
});

app.post("/pass/:id", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }
  try {
    const one = await hisaab.findOne({ _id: req.params.id });
    if (one.encryptPass == req.body.pass.trim()) {
      res.redirect(`/view/${req.params.id}?success=true`);
    } else {
      res.redirect(`/view/${req.params.id}?error=true`);
    }
  } catch (error) {
    console.log(error);
    res.send("Server Error");
  }
});

app.post('/share/:id',async(req,res)=>{
    
})
app.listen(process.env.SERVER_PORT, () => {
  debug("Server is running on port given in .env file");
})
