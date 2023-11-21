const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.use(
  session({
    secret: "somevalue",
    resave: false,
    saveUninitialized: false,
  }),
);


var userProfilePicture = ""
var userName = "";
app.get("/", isAuthenticated, (req, res) => {
  fs.readFile("index.html", 'utf-8', function(err, data){
    if (err) {
      return console.log(err)
    }
    const result = data.replace("profilePictureUser", userProfilePicture)
    console.log(userProfilePicture)
    fs.writeFile(userName + ".html", result, 'utf-8', function (err) {
      if (err){
        return console.log(err)
      }
    })
  })
  res.sendFile(path.join(__dirname + "/" + userName + ".html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "register.html"));
});

app.post("/register", (req, res) => {
  try {
    const profileType = req.body["profileType"];

    const password = req.body.password;
    const username = req.body.username;

    const row = profileType + ";" + password + ";" + username + "\n";
    fs.appendFile("registrations.txt", row, (err) => {
      if (err) {
        return res.status(500).send("Internal Server Error");
      }

      res.redirect("/login");
    });
    console.log(row);
  } catch (err) {
    console.log(err);
    res.redirect("/register");
  }
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/login", (req, res) => {
  fs.readFile("registrations.txt", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
      return;
    }
    const lines = data.split("\n");

    const username = req.body.username;
    const password = req.body.password;
    let userFound = false;

    for (const line of lines) {
      const [savedProfileType, savedPassword, savedUsername] = line.split(";");
      console.log(`Comparing: ${username} with ${savedUsername}`);

      if (username === savedUsername) {
        if (password === savedPassword) {
          req.session.authenticated = true;
          userName = savedUsername;
          req.session.username = savedUsername
          userProfilePicture = "/images/" + savedProfileType + "ImagePic.jpg";
          res.redirect("/")
          userFound = true;
          break;
        } else {
          res.status(401).send("Incorrect password");
        }
      }
    }

    if (!userFound) {
      res.status(401).send("No user found");
    }
  });
});

app.get('/edit', (req, res) => {
  res.sendFile(path.join(__dirname, "edit.html"));
})

app.post('/edit', isAuthenticated, (req, res) => {
  const newUsername = req.body.newUsername;
  const newPassword = req.body.newPassword;
  const newProfileType = req.body["profileType"];

  fs.readFile("registrations.txt", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Internal server error");
    }

    const lines = data.split("\n");

    for (let i = 0; i < lines.length; i++){
     
      const [savedProfileType, savedPassword, savedUsername] = lines[i].split(";");
      console.log(`Comparing: ${userName} with ${savedUsername}`);
      if (savedUsername === userName) {
        lines[i] = `${newProfileType};${newPassword};${newUsername}`;
        const updatedData = lines.join("\n");

        fs.writeFile("registrations.txt", updatedData, (err) => {
          if (err){
            console.log (err);
            return res.status(500).send("Internal Server Error");
          }

          res.redirect('/login')
        });
        return;
      }
    }

    res.status(500).send("User not found!");
  })
})

function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    return next();
  } else {
    res.redirect("/login");
  }
}

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/login");
  });
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");''
});
