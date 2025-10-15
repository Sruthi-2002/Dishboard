const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const app = express();

app.use(express.static("public"));
app.use(express.json());

const users = [];
const sessions = {};
const recipes = [];

// Nodemailer setup (Ethereal)
let transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "YOUR_ETHEREAL_USER", // get from ethereal.email
    pass: "YOUR_ETHEREAL_PASS"
  }
});

// Routes

// Serve index
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// Signup
app.post("/signup", (req, res) => {
  const { fullName, username, email, password } = req.body;
  if (!fullName || !username || !email || !password)
    return res.status(400).send("Missing fields");
  if (users.find(u => u.username === username || u.email === email))
    return res.status(409).send("Username or email already exists");

  users.push({ fullName, username, email, password });
  res.status(201).send("Signup successful");
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).send("Invalid credentials");

  const token = Math.random().toString(36).substring(2);
  sessions[token] = username;
  res.json({ token });
});

// Logout
app.post("/logout", (req, res) => {
  const { token } = req.body;
  delete sessions[token];
  res.sendStatus(200);
});

// Post a recipe
app.post("/post", (req, res) => {
  const { title, content, token } = req.body;
  if (!title || !content) return res.status(400).send("Missing fields");
  const author = sessions[token] || "Guest";
  recipes.push({ id: Date.now(), title, content, author });
  res.status(201).send("Recipe posted");
});

// Edit a recipe
app.put("/edit/:id", (req, res) => {
  const { id } = req.params;
  const { title, content, token } = req.body;
  const username = sessions[token];
  const recipe = recipes.find(r => r.id == id);
  if (!recipe) return res.status(404).send("Not found");
  if (recipe.author !== username) return res.status(403).send("Not your post");

  recipe.title = title;
  recipe.content = content;
  res.send("Recipe updated");
});

// Delete a recipe
app.delete("/delete/:id", (req, res) => {
  const { id } = req.params;
  const { token } = req.body;
  const username = sessions[token];
  const idx = recipes.findIndex(r => r.id == id);
  if (idx === -1) return res.status(404).send("Not found");
  if (recipes[idx].author !== username) return res.status(403).send("Not your post");

  recipes.splice(idx, 1);
  res.send("Recipe deleted");
});

// Forgot password - send reset token via email
app.post("/forgot", async (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).send("Email not found");

  const token = Math.random().toString(36).substring(2, 8);
  user.resetToken = token;

  let info = await transporter.sendMail({
    from: '"Cooking Blog" <no-reply@cookingblog.com>',
    to: email,
    subject: "Password Reset Token",
    text: `Your reset token is: ${token}`
  });

  console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
  res.send("Reset token sent to your email!");
});

// Reset password
app.post("/reset", (req, res) => {
  const { email, token, newPassword } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).send("Email not found");
  if (user.resetToken !== token) return res.status(401).send("Invalid token");

  user.password = newPassword;
  delete user.resetToken;
  res.send("Password reset successful!");
});

// Get all recipes
app.get("/recipes", (req, res) => res.json(recipes));

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
