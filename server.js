const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const session = require('express-session')
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))

app.use(
    session({
      secret: 'somevalue',
      resave: false,
      saveUninitialized: false,
    }),
);

app.get(['/', '/index'], isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'))
})

app.post('/register', (req, res) => {
    try {
        const profileType = req.body['profileType']

        const password = req.body.password
        const username = req.body.username
    
        const row = profileType + ";" + password + ";" + username + "\n"
        fs.appendFile('registrations.txt', row, (err) => {
            if (err) {
                return res.status(500).send('Internal Server Error')
            }

            res.redirect('/login')
        })
        console.log(row)
        } catch (err) {
            console.log(err)
            res.redirect('/register')
        }
        
})


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'))
})

app.post('/login', (req, res) => {
    fs.readFile("registrations.txt", "utf8", (err, data) => {
        if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error");
          return;
        }
    
        const lines = data.split("\n");
    
        const username = req.body.username;
        const password = req.body.password;
        let userFound = false

        for (const line of lines) {
            const [savedProfileType, savedPassword, savedUsername] = line.split(';')
            console.log(`Comparing: ${username} with ${savedUsername}`);

            if (username === savedUsername) {
                if (password === savedPassword){
                    req.session.authenticated = true;
                    const userProfileType = savedProfileType
                    res.redirect(`/index?profileType=${userProfileType}`)
                    userFound = true
                    break
                } else {
                    res.status(401).send("Incorrect password");
                }
            }
        }
        
        if (!userFound){
            res.status(401).send('No user found')
        }
    })
})

function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        return next()
    } else {
        res.redirect('/login')
    }
}

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
        console.error(err)
        }
        res.redirect('/login')
    })
})


app.listen(5000, () => {
    console.log('Server is running on port 5000')
})