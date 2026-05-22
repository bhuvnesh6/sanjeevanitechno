from flask import Flask, render_template, request, redirect, session, url_for, flash, jsonify
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
from bson.objectid import ObjectId
import secrets
from datetime import datetime

load_dotenv()

app = Flask(__name__)

# Basic Security
app.secret_key = os.getenv("SECRET_KEY")

# Mongo Config
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

admins = db.admins
posts = db.posts
enquiries = db.enquiries

# =========================
# Public Routes
# =========================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/about")
def about():
    return render_template("about-us.html")


@app.route("/services")
def services():
    return render_template("service.html")


@app.route("/shreenika")
def shreenika():
    return render_template("shreenika.html")


# =========================
# Admin Login
# =========================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        admin = admins.find_one({"username": username})

        if admin and check_password_hash(admin["password"], password):
            session["admin"] = username
            return redirect(url_for("admin"))

        flash("Invalid Credentials")
        return redirect(url_for("login"))

    return render_template("login.html")


# =========================
# Protected Admin Route
# =========================

@app.route("/admin")
def admin():

    if "admin" not in session:
        return redirect(url_for("login"))

    return render_template("admin.html")


# =========================
# Logout
# =========================

@app.route("/logout")
def logout():
    session.pop("admin", None)
    return redirect(url_for("login"))


# =========================
# Create First Admin (run once)
# =========================

@app.route("/create-admin")
def create_admin():

    username = "admin"
    password = "admin123"

    existing = admins.find_one({"username": username})

    if existing:
        return "Admin already exists"

    hashed_password = generate_password_hash(password)

    admins.insert_one({
        "username": username,
        "password": hashed_password
    })

    return "Admin created successfully"


@app.route("/signup", methods=["GET", "POST"])
def signup():

    if request.method == "POST":

        username = request.form.get("username").strip()
        password = request.form.get("password")

        existing_user = admins.find_one({"username": username})

        if existing_user:
            flash("Username already exists")
            return redirect(url_for("signup"))

        hashed_password = generate_password_hash(password)

        admins.insert_one({
            "username": username,
            "password": hashed_password,
            "role": "admin",
            "is_active": True
        })

        flash("Account created successfully")
        return redirect(url_for("login"))

    return render_template("signup.html")


# =========================
# Write Page
# =========================

@app.route("/write")
def write():

    if "admin" not in session:
        return redirect(url_for("login"))

    return render_template("write.html")


# =========================
# Blog API — Create
# =========================

@app.route("/api/posts", methods=["POST"])
def create_post():

    if "admin" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json()

    title      = data.get("title", "").strip()
    body_html  = data.get("body_html", "").strip()
    body_text  = data.get("body_text", "").strip()

    if not title or not body_text:
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    slug = data.get("slug", "")

    if posts.find_one({"slug": slug}):
        slug = f"{slug}-{secrets.token_hex(3)}"

    post_data = {
        "title":       title,
        "body_html":   body_html,
        "body_text":   body_text,
        "excerpt":     data.get("excerpt", body_text[:200]),
        "tags":        data.get("tags", []),
        "category":    data.get("category", ""),
        "status":      data.get("status", "draft"),
        "cover_image": data.get("cover_image", ""),
        "word_count":  data.get("word_count", 0),
        "created_at":  data.get("created_at", datetime.utcnow().isoformat()),
        "updated_at":  datetime.utcnow().isoformat(),
        "slug":        slug,
        "author":      session["admin"]
    }

    inserted = posts.insert_one(post_data)

    return jsonify({
        "success":  True,
        "message":  "Post created successfully",
        "post_id":  str(inserted.inserted_id),
        "slug":     slug
    })


# =========================
# Blog API — List (Admin)
# =========================

@app.route("/api/admin/posts", methods=["GET"])
def get_admin_posts():
    """Returns ALL posts (all statuses) for the admin dashboard."""

    if "admin" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    all_posts = list(posts.find().sort("created_at", -1))

    # Convert ObjectId → string so JSON can serialise it
    for post in all_posts:
        post["_id"] = str(post["_id"])

    return jsonify({"success": True, "posts": all_posts})


# =========================
# Blog API — Update
# =========================

@app.route("/api/posts/<post_id>", methods=["PUT"])
def update_post(post_id):

    if "admin" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    try:
        obj_id = ObjectId(post_id)
    except Exception:
        return jsonify({"success": False, "message": "Invalid post ID"}), 400

    existing = posts.find_one({"_id": obj_id})
    if not existing:
        return jsonify({"success": False, "message": "Post not found"}), 404

    data = request.get_json()

    # Only update the fields the admin dashboard sends; never overwrite body content here
    update_fields = {}

    allowed = ["title", "excerpt", "category", "status", "tags", "cover_image"]
    for field in allowed:
        if field in data:
            update_fields[field] = data[field]

    update_fields["updated_at"] = datetime.utcnow().isoformat()

    posts.update_one({"_id": obj_id}, {"$set": update_fields})

    return jsonify({"success": True, "message": "Post updated successfully"})


# =========================
# Blog API — Delete
# =========================

@app.route("/api/posts/<post_id>", methods=["DELETE"])
def delete_post(post_id):

    if "admin" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    try:
        obj_id = ObjectId(post_id)
    except Exception:
        return jsonify({"success": False, "message": "Invalid post ID"}), 400

    result = posts.delete_one({"_id": obj_id})

    if result.deleted_count == 0:
        return jsonify({"success": False, "message": "Post not found"}), 404

    return jsonify({"success": True, "message": "Post deleted successfully"})


# =========================
# Public Blog Routes
# =========================

@app.route("/blogs")
def blogs():

    all_posts = posts.find({"status": "published"}).sort("created_at", -1)

    return render_template("blogs.html", posts=all_posts)


@app.route("/blog/<post_id>")
def single_blog(post_id):

    try:
        post = posts.find_one({"_id": ObjectId(post_id), "status": "published"})

        if not post:
            return "Blog not found", 404

        return render_template("single-blog.html", post=post)

    except Exception:
        return "Invalid Blog ID", 400


# =========================
# Enquiry Routes
# =========================

@app.route("/submit-enquiry", methods=["POST"])
def submit_enquiry():

    full_name = request.form.get("full_name", "").strip()
    email     = request.form.get("email", "").strip()
    phone     = request.form.get("phone", "").strip()
    service   = request.form.get("service", "").strip()
    message   = request.form.get("message", "").strip()

    if not full_name or not email or not phone or not message:
        flash("Please fill all required fields")
        return redirect(url_for("home"))

    enquiries.insert_one({
        "full_name":  full_name,
        "email":      email,
        "phone":      phone,
        "service":    service,
        "message":    message,
        "status":     "new",
        "created_at": datetime.utcnow().isoformat()
    })

    flash("Enquiry submitted successfully!")
    return redirect(url_for("home"))


@app.route("/api/enquiries")
def get_enquiries():

    if "admin" not in session:
        return redirect(url_for("login"))

    all_enquiries = list(enquiries.find().sort("_id", -1))

    for enq in all_enquiries:
        enq["_id"] = str(enq["_id"])

    return render_template("enquiries.html", enquiries=all_enquiries)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8713)