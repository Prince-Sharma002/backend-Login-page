import express, { json } from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { name } from "ejs";
import bcrypt from "bcrypt";


mongoose
.connect(
    "mongodb://localhost:27017" , {
        dbName : "contactForm"
    })
    .then(()=> console.log("database is connected") )
    .catch((e) => console.log(e))

// create schema of collection 
const userSchema = new mongoose.Schema({
    name : String,
    email : String,
    password : String,
});


const User = mongoose.model( "Users"  , userSchema );


const app = express();

// middleware
app.use(express.static( path.join( path.resolve() , "public" ) ) );
app.use( express.urlencoded() );
app.set( "view engine" , "ejs" );
app.use(cookieParser());

const isAuthenticated = async (req,res,next) =>{
    const {token} = req.cookies;
    if( token){

        // make 
        const decoded = jwt.verify(token , "asdjhsdsdss");
        req.user =  await User.findById(decoded._id);

        next();
    }
    else{
        res.render("login");
    }
};

app.get( "/" ,  isAuthenticated , (req,res) =>{ 
    res.render("logout", { name: req.user.name });
})

app.get("/login", (req, res) => {
    res.render("login");
  });

app.get( "/register" , (req,res) =>{ 
    res.render("register");
})

app.post("/login" , async(req,res)=>{
    const {name , email , password } = req.body;
    let user = await User.findOne({email});

    if( !user ) return res.redirect("/register");

    const isMatch = user.password === password;

    if( !isMatch) return res.render("login" , {message : "wrong password"})

    // encode id of user
    const token = jwt.sign({_id: user._id } , "asdjhsdsdss" );

    res.cookie("token" , token , {
        expires : new Date( Date.now() + 60*6000),
        httpOnly : true,
    })
    res.redirect("/");

})
 
app.post("/register" , async (req,res)=>{
  
    const {name , email , password} = req.body;
    let user = await User.findOne({email});
    if( user )
        return res.redirect("/login")

    const hasedPassword = await bcrypt.hash(password , 10);

    user = await User.create({
        name,
        email,
        password : hasedPassword,
    })
  
    // encode id of user
    const token = jwt.sign({_id: user._id } , "asdjhsdsdss" );

    res.cookie("token" , token , {
        expires : new Date( Date.now() + 60*6000),
        httpOnly : true,
    })
    res.redirect("/");
})

app.get("/logout" ,(req,res)=>{
    res.cookie("token" , "null" , {
        expires : new Date( Date.now()),
        httpOnly : true,
    })
    res.redirect("/");  
})



app.listen(5000, ()=>{
    console.log("server is working");
})