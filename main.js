const API = "http://localhost:3000";

window.addEventListener("DOMContentLoaded", () => {
  LoadPosts();
  LoadComments();
});

// =====================
// Helpers
// =====================
function safeInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

async function getNextId(resource) {
  const res = await fetch(`${API}/${resource}`);
  const items = await res.json();

  let maxId = 0;
  for (const it of items) {
    const n = parseInt(it.id, 10);
    if (!Number.isNaN(n) && n > maxId) maxId = n;
  }
  return String(maxId + 1); // ID luôn lưu chuỗi
}

// =====================
// POSTS (Soft Delete + Restore)
// =====================
async function LoadPosts() {
  const res = await fetch(`${API}/posts`);
  const posts = await res.json();

  const body = document.getElementById("body_table_posts");
  body.innerHTML = "";

  for (const post of posts) {
    const isDeleted = !!post.isDeleted;

    body.innerHTML += `
      <tr class="${isDeleted ? "deleted" : ""}">
        <td>${post.id}</td>
        <td>${post.title ?? ""}</td>
        <td>${post.views ?? ""}</td>
        <td class="status">${isDeleted ? "Deleted" : "Active"}</td>
        <td class="action-cell">
          ${
            isDeleted
              ? `<button class="btn-restore" onclick="RestorePost('${post.id}')">Restore</button>`
              : `<button class="btn-soft" onclick="SoftDeletePost('${post.id}')">Soft Delete</button>`
          }
        </td>
      </tr>
    `;
  }
}

async function SavePost() {
  let id = document.getElementById("id_txt").value.trim();
  const title = document.getElementById("title_txt").value.trim();
  const views = safeInt(document.getElementById("view_txt").value.trim(), 0);

  // CREATE
  if (id === "") {
    const newId = await getNextId("posts");
    const res = await fetch(`${API}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newId,          // chuỗi
        title: title,
        views: views,
        isDeleted: false
      })
    });

    if (!res.ok) console.log("Tạo post thất bại");
    await LoadPosts();
    ClearPostForm();
    return false;
  }

  // UPDATE
  const getItem = await fetch(`${API}/posts/${id}`);
  if (!getItem.ok) {
    alert("Không tìm thấy post để update. Muốn tạo mới thì để trống ID.");
    return false;
  }

  const existing = await getItem.json();
  const res = await fetch(`${API}/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: String(existing.id),
      title: title,
      views: views,
      isDeleted: !!existing.isDeleted
    })
  });

  if (!res.ok) console.log("Update post thất bại");
  await LoadPosts();
  ClearPostForm();
  return false;
}

async function SoftDeletePost(id) {
  const res = await fetch(`${API}/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isDeleted: true })
  });

  if (!res.ok) console.log("Soft delete thất bại");
  await LoadPosts();
  return false;
}

async function RestorePost(id) {
  const res = await fetch(`${API}/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isDeleted: false })
  });

  if (!res.ok) console.log("Restore thất bại");
  await LoadPosts();
  return false;
}

function ClearPostForm() {
  document.getElementById("id_txt").value = "";
  document.getElementById("title_txt").value = "";
  document.getElementById("view_txt").value = "";
}

// =====================
// COMMENTS (CRUD) - nhập postId bằng text
// =====================
async function LoadComments() {
  const res = await fetch(`${API}/comments`);
  const comments = await res.json();

  const body = document.getElementById("body_table_comments");
  body.innerHTML = "";

  for (const c of comments) {
    body.innerHTML += `
      <tr>
        <td>${c.id}</td>
        <td>${c.text ?? ""}</td>
        <td>${c.postId ?? ""}</td>
        <td class="actions">
          <button onclick="EditComment('${c.id}')">Edit</button>
          <button class="danger" onclick="DeleteComment('${c.id}')">Delete</button>
        </td>
      </tr>
    `;
  }
}

async function SaveComment() {
  let id = document.getElementById("comment_id_txt").value.trim();
  const text = document.getElementById("comment_text_txt").value.trim();
  const postId = document.getElementById("comment_postId_txt").value.trim();

  if (postId === "") {
    alert("Vui lòng nhập Post ID");
    return false;
  }

  // (tuỳ chọn) kiểm tra postId có tồn tại không
  const check = await fetch(`${API}/posts/${postId}`);
  if (!check.ok) {
    alert("Post ID không tồn tại!");
    return false;
  }

  // CREATE
  if (id === "") {
    const newId = await getNextId("comments");
    const res = await fetch(`${API}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newId, // chuỗi
        text: text,
        postId: postId
      })
    });

    if (!res.ok) console.log("Tạo comment thất bại");
    await LoadComments();
    ClearCommentForm();
    return false;
  }

  // UPDATE
  const getItem = await fetch(`${API}/comments/${id}`);
  if (!getItem.ok) {
    alert("Không tìm thấy comment để update. Muốn tạo mới thì để trống ID.");
    return false;
  }

  const res = await fetch(`${API}/comments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: String(id),
      text: text,
      postId: postId
    })
  });

  if (!res.ok) console.log("Update comment thất bại");
  await LoadComments();
  ClearCommentForm();
  return false;
}

async function EditComment(id) {
  const res = await fetch(`${API}/comments/${id}`);
  if (!res.ok) return;

  const c = await res.json();
  document.getElementById("comment_id_txt").value = c.id ?? "";
  document.getElementById("comment_text_txt").value = c.text ?? "";
  document.getElementById("comment_postId_txt").value = c.postId ?? "";
}

async function DeleteComment(id) {
  const res = await fetch(`${API}/comments/${id}`, { method: "DELETE" });
  if (!res.ok) console.log("Delete comment thất bại");
  await LoadComments();
  return false;
}

function ClearCommentForm() {
  document.getElementById("comment_id_txt").value = "";
  document.getElementById("comment_text_txt").value = "";
  document.getElementById("comment_postId_txt").value = "";
}
