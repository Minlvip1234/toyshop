const express = require('express');
const app = express();



var bodyParser = require("body-parser");
const { parse } = require('path');
app.use(bodyParser.urlencoded({ extended: false }));

var publicDir = require('path').join(__dirname, '/public');
app.use(express.static(publicDir));


app.set('views', './views');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb+srv://minh15:minh1507@cluster0.x1k9j.mongodb.net/test";

const session = require('express-session');

app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'some122$$%*$##!!#$%@#$%',
    cookie: { maxAge: 60000 }
}));


var hbs = require('hbs')
app.set('view engine', 'hbs')


var bodyParser = require("body-parser");
const cons = require('consolidate');
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/login', (req, res) => {
    res.render('login')
})
app.get('/register', (req, res) => {
    res.render('register')
})
app.get('/notLogin', (req, res) => {
    res.render('notLogin')
})
app.post('/new', async (req, res) => {
    var nameInput = req.body.txtName;
    var passInput = req.body.txtPassword;
    var roleInput = req.body.role;
    var newUser = { name: nameInput, password: passInput, role: roleInput };

    let client = await MongoClient.connect(url);
    let dbo = client.db("toyshop");
    await dbo.collection("users").insertOne(newUser);
    res.redirect('/login')
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
        res.render('login', { message: 'Invalid user!' })
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

app.get('/allProduct', async (req, res) => {
    var user = req.session.User;
    let client = await MongoClient.connect(url, { useUnifiedTopology: true });
    let dbo = client.db("toyshop");
    let results = await dbo.collection("products").find({}).sort({ Name: -1 }).toArray();
    if (!user || user.name == '') {
        res.render('notLogin', { message: 'user chua dang nhap' })
    } else {
        res.render('allProduct', { name: user.name, role: user.role, model: results })
    }
})

//////////////////////////////////////////////////////////////////////////////////////////

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


app.get('/delete', async (req, res) => {
    let inputId = req.query.id;
    let client = await MongoClient.connect(url);
    let dbo = client.db("toyshop");
    var ObjectID = require('mongodb').ObjectID;
    let condition = { "_id": ObjectID(inputId) };
    await dbo.collection("products").deleteOne(condition);
    res.redirect('/allProduct');
})

app.get('/Cart', async (req, res) => {
    var user = req.session.User;
    let client = await MongoClient.connect(url, { useUnifiedTopology: true });
    let dbo = client.db("toyshop");
    let result = await dbo.collection("category").find({}).sort({ Name: -1 }).toArray();
    if (!user || user.name == '') {
        res.render('notLogin', { message: 'user chua dang nhap' })
    } else {
        res.render('Cart', { name: user.name, role: user.role, model: result })
    }
})
app.get('/insert', async (req, res) => {
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
            res.render('insert', { name: user.name, role: user.role })
        }
    }

})
app.get('/Moreabout', (req, res) => {
    res.render('Moreabout.hbs');
})
app.get('/Contact', (req, res) => {
    res.render('Contact.hbs');
})
app.get('/user', (req, res) => {
    res.render('user.hbs');
})
app.post('/doInsert', async (req, res) => {
    let inputName = req.body.txtName;
    let inputID = req.body.txtID;
    let inputImage = req.body.txtImage;
    let inputNumber = req.body.txtNumber;
    let inputPrice = req.body.txtPrice;
    let newProduct = { Name: inputName, ID: inputID, Image: inputImage, Number: inputNumber, Price: inputPrice };
    if (inputName.trim().length == 0) {
        let modelError = { nameError: "Invalid Name", mspError: "Invalid ID" };
        res.render('Insert.hbs', { model: modelError });
    } else {
        let client = await MongoClient.connect(url);
        let dbo = client.db("toyshop");
        await dbo.collection("products").insertOne(newProduct);
        res.redirect('/allProduct');
    }
})

app.post('/doSearch', async (req, res) => {
    let inputName = req.body.txtName;
    let client = await MongoClient.connect(url);
    let dbo = client.db("toyshop");
    let results = await dbo.collection("products").find({ Name: new RegExp(inputName, 'i') }).toArray();
    res.render('allProduct', { model: results });

})

app.get('/update', async (req, res) => {
    let id = req.query.id;
    console.log(id)
    let client = await MongoClient.connect(url, { useUnifiedTopology: true });
    let dbo = client.db("toyshop");
    var ObjectID = require('mongodb').ObjectID;
    let condition = { "_id": ObjectID(id) };
    let results = await dbo.collection("products").find(condition).toArray();
    res.render('update', { model: results });
})
app.post('/doupdate', async (req, res) => {
    let id = req.body.id;
    var ObjectID = require('mongodb').ObjectID;
    let condition = { "_id": ObjectID(id) };
    console.log(condition)
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


const PORT = process.env.PORT || 5000

app.listen(PORT);
console.log('Running at port 5000')