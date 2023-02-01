CREATE TABLE users (
	id TEXT PRIMARY KEY UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
	role TEXT NOT NULL,
	created_at TEXT NOT NULL
);


CREATE TABLE posts (
	id TEXT PRIMARY KEY UNIQUE NOT NULL,
	creator_id TEXT UNIQUE NOT NULL,
	content TEXT NOT NULL,
	likes INTEGER NOT NULL,
	dislikes INTEGER NOT NULL,
	created_at TEXT NOT NULL,
	uploaded_at TEXT NOT NULL
);


CREATE TABLE likes_dislikes (
	user_id TEXT NOT NULL,
	post_id TEXT NOT NULL,
	likeS INTEGER NOT NULL
);



