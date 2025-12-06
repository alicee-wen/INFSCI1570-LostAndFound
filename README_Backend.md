
##### End Points ##### 

# Users: 

* GET /users - Gives the full list of current users.
* GET /users/:id - Gives a specific user's _id, username, email, password_hash, and date_created. The true password is NOT given, only the hashed version. 
* POST /users - Creates a new user. Takes username, email, and password. _id and date_created are automatically created and assigned
* PUT /users/:id - Changes a user's username, email, or password. _id and date_created cannot be changed.
* DELETE /users/:id - Deletes a specific user from the database. 

# Posts: 

* GET /posts - Gives the full list of current posts.
* GET /posts/:id - Gives a specific post's _id, author_id, content, and date_created. If it finds a valid author, it will also return that author's _id, username, and email. 
* POST /posts - Creates a new post. Takes author_id and content. _id and date_created are automatically created and assigned. 
* PUT /posts/:id - Changes a post's content. _id, author_id, and date_created cannot be changed. 
* DELETE /posts/:id - Deletes a specific post from the database. 

# Mixed: 

* GET /users/:id/posts - Gives all posts attributed to that user's id. 


##### Examples ##### 

# Users:

* GET all users. 

Input:
curl -Method GET "http://localhost:3000/users"

* GET a specific user.

Input: 
curl -Method GET "http://localhost:3000/users/user1"

* POST a new user. 

Input: 
curl -Method POST "http://localhost:3000/users" -Headers @{ "Content-Type" = "application/json" } -Body '{ "username": "testuser", "email": "testuser@gmail.com", "password": "mypassword" }'


* PUT to update an existing user.

Input: 
curl -Method PUT "http://localhost:3000/users/user2" -Headers @{ "Content-Type" = "application/json" } -Body '{ "username": "newname", "password": "newpassword" }'


* DELETE an existing user. 

Input: 
curl -Method DELETE "http://localhost:3000/users/user2"

# Posts: 

* GET all posts

Input: 
curl -Method GET "http://localhost:3000/posts"

* GET a specific post

Input: 
curl -Method GET "http://localhost:3000/posts/post1"

* POST a new post. 

Input: 
curl -Method POST "http://localhost:3000/posts" -Headers @{ "Content-Type" = "application/json" } -Body '{ "author_id": "user1", "content": "This is a new post" }'

* PUT an existing post.

Input: 
curl -Method PUT "http://localhost:3000/posts/post2" -Headers @{ "Content-Type" = "application/json" } -Body '{ "content": "Updated content" }'

* DELETE an existing post. 

Input: 
curl -Method DELETE "http://localhost:3000/posts/post2"


# Mixed: 

* Get all posts from a specific user: 

Input: 
curl -Method GET "http://localhost:3000/users/user1/posts"
