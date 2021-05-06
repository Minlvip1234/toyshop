/////////////////////
//express
const express = require('express');
const app = express();
/////////////////////

/////////////
//get views
app.set('views', './views');
/////////////
//mongodb
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017";
/////////////
//session
const session = require('express-session');
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'some122$$%*$##!!#$%@#$%',
    cookie: { maxAge: 60000 }
}));
//////////////
//hbs
var hbs = require('hbs')
app.set('view engine', 'hbs')
//////////////
//bodyparser
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }))
///////////////

/////////////////////////////////////////////////////////////////////////////////////////
//not login page
app.get('/notLogin', (req, res) => {
    res.render('notLogin')
})

////////////////////
//regiter
app.get('/register', (req, res) => {
    res.render('register')
})

app.post('/new', async (req, res) => {
    var nameInput = req.body.txtName;
    var passInput = req.body.txtPassword;
    var roleInput = req.body.role;
    if (nameInput.trim().length >= 8 && passInput.trim().length >= 8  && isNumeric(nameInput) == false && isNumeric(passInput) == false)
    {
        var newUser = { name: nameInput, password: passInput, role: roleInput };
        let client = await MongoClient.connect(url);
        let dbo = client.db("toyshop");
        await dbo.collection("users").insertOne(newUser);
        res.redirect('/login')
    }
    else
    {      
        res.render('register', {nameerr: 'Username and password must be more than 8 character, username and password can not only have number'})

    }
})
//////////////////////////
//login
app.get('/login', (req, res) => {
    res.render('login')
})
app.post('/doLogin', async (req, res) => {
    var nameInput = req.body.txtName;
    var passInput = req.body.txtPassword;
    let client = await MongoClient.connect(url);
    let dbo = client.db("toyshop");
    const cursor = dbo.collection("users").
        find({ $and: [{ name: nameInput }, { password: passInput }] });
    const count = await cursor.count();    

    if (count == 0) {
        res.render('login', {geterr: 'Wrong account please try again !!!'})
    } else {
        let name = '';
        let role = ''
        await cursor.forEach(doc => {
            name = doc.name;
            role = doc.role;
        })
        req.session.User = {
            name: name,
            role: role
        }
        if (role == 'admin') {
            res.redirect('/allProduct');
        }
        else { res.redirect('/') }
    }
})
//////////////////////////////
//index off admin page
app.get('/allProduct', async (req, res) => {
    var user = req.session.User;
    let client = await MongoClient.connect(url, { useUnifiedTopology: true });
    let dbo = client.db("toyshop");
    let results = await dbo.collection("products").find({}).sort({ Name: -1 }).toArray();
    if (user.role == 'user')
    {
        res.render('login')
    }
    else
    {
        if (!user || user.name == '') {
            res.render('notLogin', { message: 'user chua dang nhap' })
        } else {
            res.render('allProduct', { name: user.name, role: user.role, model: results })
        }
    }
})

/////////////////////////////////
//indax off user page
app.get('/', async (req, res) => {
    var user = req.session.User;
    let client = await MongoClient.connect(url, { useUnifiedTopology: true });
    let dbo = client.db("toyshop");
    let results = await dbo.collection("products").find({}).sort({ Name: -1 }).toArray();
    if (!user || user.name == '') {
        res.render('notLogin', { message: 'user chua dang nhap' })
    } else {
        res.render('index', { name: user.name, role: user.role, model: results })
    }
})
//////////////////////////////////
//delete function
app.get('/delete', async (req, res) => {
    let inputId = req.query.id;
    let client = await MongoClient.connect(url);
    let dbo = client.db("toyshop");
    var ObjectID = require('mongodb').ObjectID;
    let condition = { "_id": ObjectID(inputId) };
    await dbo.collection("products").deleteOne(condition);
    res.redirect('/allProduct');
})

/////////////////
//insert product for admin page
app.get('/Insert', async (req, res) => {
    var user = req.session.User;
    let client = await MongoClient.connect(url, { useUnifiedTopology: true });
    let dbo = client.db("toyshop");
    if (user.role == 'user') {
        res.render('login')
    }
    else {
        if (!user || user.name == '') {
            res.render('notLogin', { message: 'user chua dang nhap' })
        } else {
            res.render('Insert', { name: user.name, role: user.role })
        }
    }
})
//insert function
app.post('/doInsert', async (req, res) => {
    var user = req.session.User;
    let client = await MongoClient.connect(url, { useUnifiedTopology: true });
    let dbo = client.db("toyshop");
    let inputName = req.body.txtName;
    let inputID = req.body.txtID;
    let inputImage = req.body.txtImage;
    let inputNumber = req.body.txtNumber;
    let inputPrice = req.body.txtPrice;
    if (isNumeric(inputName) == false && isNumeric(inputID) == true && isNumeric(inputPrice) == true && isNumeric(inputNumber) == true && inputNumber.trim().length == 9)
    {
        let newProduct = { Name: inputName, ID: inputID, Image: inputImage, Number: "+84 \t" + inputNumber, Price: inputPrice };
        if (inputName.trim().length == 0) {
            let modelError = { nameError: "Invalid Name", mspError: "Invalid ID" };
            res.render('Insert.hbs', { model: modelError });
        } else {
            let client = await MongoClient.connect(url);
            let dbo = client.db("toyshop");
            await dbo.collection("products").insertOne(newProduct);
            res.redirect('/allProduct');
        }
    }
    else
    {
        res.render('insert',  
        { 
            name: user.name, 
            role: user.role,
            logerr: 'Name must be numbers and characters, ID must be a number, phone of Number must be 9 numbers and price must be a number' 
        })
    }
})
///////////////////////
//sert function
app.post('/doSearch', async (req, res) => {
    let inputName = req.body.txtName;
    let client = await MongoClient.connect(url);
    let dbo = client.db("toyshop");
    let results = await dbo.collection("products").find({ Name: new RegExp(inputName, 'i') }).toArray();
    res.render('allProduct', { model: results });

})

///////////////////////
//update page
app.get('/update', async (req, res) => {
    let id = req.query.id;
    let client = await MongoClient.connect(url, { useUnifiedTopology: true });
    let dbo = client.db("toyshop");
    var ObjectID = require('mongodb').ObjectID;
    let condition = { "_id": ObjectID(id) };
    let results = await dbo.collection("products").find(condition).toArray();
    res.render('update', { model: results });
})
//upadte function
app.post('/doupdate', async (req, res) => {
    let id = req.body.id;
    var ObjectID = require('mongodb').ObjectID;
    let condition = { "_id": ObjectID(id) };
    let client = await MongoClient.connect(url, { useUnifiedTopology: true });
    let dbo = client.db("toyshop");
    change = {
        $set: {
            Name: req.body.txtName,
            ID: req.body.txtID,
            Number: req.body.txtNumber,
            Price: req.body.txtPrice
        }
    }
    await dbo.collection("products").updateOne(condition, change);
    res.redirect('/allProduct');
})
//////////////////
function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
/////////////////
//mangament user page
app.get('/changePasswordUser', async (req, res) => {
    var user = req.session.User;    
    let id = req.body.id;
    let client = await MongoClient.connect(url, { useUnifiedTopology: true });
    let dbo = client.db("toyshop");
    if (!user || user.name == '') {
        res.render('notLogin', { message: 'user chua dang nhap' })
    } else {
        if (user.role == 'user')
        {
            res.render('login')
        }
        else{
        let results = await dbo.collection("users").find({}).toArray();
        res.render('changePasswordUser', {name: user.name, role: user.role, model: results});
    }}
    
})

//////////////////
//delete user
app.get('/deletee', async (req, res) => {
    var user = req.session.User;   
    let inputId = req.query.id;
    let client = await MongoClient.connect(url);
    let dbo = client.db("toyshop");
    var ObjectID = require('mongodb').ObjectID;
    let condition = { "_id": ObjectID(inputId) };
    await dbo.collection("users").deleteOne(condition);
    console.log(user.role);
    res.redirect('/allProduct');
})

//app.post('/doupdateuser', async (req, res) => {
    //var user = req.session.User;    
    //let inputId = req.query.id;
    //let client = await MongoClient.connect(url);
    //let dbo = client.db("toyshop");
    //var ObjectID = require('mongodb').ObjectID;
    //let condition = { "_id": ObjectID(inputId) };
    //let nameuser = user.name;
    //let passworduser = user.password;
    //console.log(user.name, user.role)
    //change = {
        //$set: {
            //this -> name: req.body.txtNameUser,
            //this -> password: req.body.txtPasswordUser
      //  }
    //}
    //await dbo.collection("users").updateOne(condition, change);
    //res.redirect('/changePasswordUser');
//})


//run server
const PORT = process.env.PORT || 5000
app.listen(PORT);
console.log('Running at port 5000')
/////////////
//end