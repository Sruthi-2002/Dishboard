let username = localStorage.getItem("username") || "Guest";
let fullname = localStorage.getItem("fullname") || username;

document.getElementById("user-name").textContent = `👋 Hi, ${fullname}`;

const likes = {};
const comments = {};
const recipes = [];

function postRecipe() {
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  if(!title || !content) { alert("Fill title & content!"); return; }

  recipes.push({ id: Date.now(), title, content, author: fullname });
  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
  loadRecipes();
}

function loadRecipes() {
  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  recipes.forEach(r => {
    likes[r.id] = likes[r.id] || 0;
    comments[r.id] = comments[r.id] || [];

    const div = document.createElement("div");
    div.className = "recipe";
    div.innerHTML = `
      <h3>${r.title}</h3>
      <p>${r.content}</p>
      <p><b>By:</b> ${r.author}</p>
      <button onclick="likeRecipe(${r.id})">❤️ ${likes[r.id]}</button>
      <button onclick="commentRecipe(${r.id})">💬 Comment</button>
      <button onclick="shareRecipe(${r.id})">🔗 Share</button>
      <button ${r.author !== fullname ? "disabled title='You can only edit your own recipes'" : ""} onclick="editRecipe(${r.id})">✏️ Edit</button>
      <button ${r.author !== fullname ? "disabled title='You can only delete your own recipes'" : ""} onclick="deleteRecipe(${r.id})">🗑️ Delete</button>
      <div id="comments-${r.id}" class="comments">
        ${comments[r.id].map(c => `<p>${c}</p>`).join("")}
      </div>
    `;
    feed.appendChild(div);
  });
}

function likeRecipe(id){ likes[id]++; loadRecipes(); }

function commentRecipe(id){ 
  const c = prompt("Enter comment:"); 
  if(!c) return; 
  comments[id].push(c); 
  loadRecipes(); 
}

function shareRecipe(id){
  const url = `${window.location.origin}/home.html#recipe-${id}`;
  navigator.clipboard.writeText(url);
  alert("Recipe link copied!");
}

function editRecipe(id){
  const recipe = recipes.find(r => r.id === id);
  if(recipe.author !== fullname) { alert("Cannot edit this recipe!"); return; }
  const title = prompt("New title:", recipe.title);
  const content = prompt("New content:", recipe.content);
  if(!title || !content) return;
  recipe.title = title;
  recipe.content = content;
  loadRecipes();
}

function deleteRecipe(id){
  const idx = recipes.findIndex(r => r.id === id);
  if(recipes[idx].author !== fullname) { alert("Cannot delete this recipe!"); return; }
  recipes.splice(idx,1);
  loadRecipes();
}

function logout(){
  localStorage.clear();
  window.location.href = "index.html";
}

window.onload = loadRecipes;
