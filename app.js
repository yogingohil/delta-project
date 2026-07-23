if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require ("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require ("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStratergy = require("passport-local");
const User = require("./models/user.js");

const listingRouter  = require("./routes/listings.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;
console.log(dbUrl);

mongoose.connection.on("error", err => {
  console.log("MongoDB error:", err);
});

main()
    .then(()=>{
        console.log("connected to DB");
    })
    .catch((err)=>{
        console.log(err);
    });

async function main() {
  await mongoose.connect(dbUrl);
}    
console.log("Secret is:", process.env.CLOUD_API_SECRET); // Should print your secret key, NOT undefined
console.log("Key is:", process.env.CLOUD_API_KEY);

app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended : true}));

app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const secret = process.env.SECRET || "mysupersecretcode";

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: secret,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err)=>{
    console.log("ERROR IN MONGO SESSION-STORE ", err);
});

const sessionOptions = {
  store,
  secret: secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;
    res.locals.mapToken = process.env.MAP_TOKEN || "";
    next();
});

// app.get("/demouser", async(req,res)=>{
//     let fakeUser = new User({
//         email : "student@gmail.com",
//         username : "alpha"
//     });

//     let registeredUser = await User.register(fakeUser, "helloword");
//     res.send(registeredUser);
// })


app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.get("/privacy", (req, res) => {
    res.render("privacy.ejs");
});

app.get("/terms", (req, res) => {
    res.render("terms.ejs");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.use ((req,res,next) =>{
    next (new ExpressError (404, "Page Not Found"));
});

app.use ((err, req,res,next) =>{
    let{statusCode=500,message="Something went wrong"} = err;
    res.status(statusCode).render("error.ejs", {message});
    // res.status(statusCode).send(message);
}); 

app.listen(8080, ()=>{
    console.log("server is listing on port 8080");
});