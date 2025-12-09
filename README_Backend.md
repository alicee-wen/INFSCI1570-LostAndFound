
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

# Comments: 

* GET /comments/:id -  Gives a specific comment's _id, author_id, content, date_created, post_id, parent_type, and parent_id. Also includes an “author” object containing the author’s username and email. If the author was deleted, placeholder values are instead returned.
* GET /comments/:id/replies - Gives a specific comment's descendants arranged in a tree. For each child, gives all of the values that GET /comments/:id gave, including the author object. The root comment itself is not included in the response, only its child comments.
* POST /comments - Creates a new comment. Takes author_id, content, parent_type, parent_id. _id, post_id, and date_created are automatically assigned.
* PUT /comments/:id - Changes a comment's content. The following fields cannot be changed: parent_type, parent_id, post_id, author_id, date created, and the comment's own _id.
* DELETE /comments/:id - Soft-Deletes a specific comment. This removes the comment's content and author_id, but otherwise leaves the comment intact. Full deletion was avoided to preserve comment chains.

# Messages: 

* GET /messages/:id - Gives all of specific message's values. 
* POST /messages - Creates a new message. Takes sender_id, recipient_id, content. _id and date_created are automatically assigned in the route code. is_read, edited, and date_edited are automatically given default values from the model file. 
* PUT /messages/:id/read - Changes a message's is_read value from false to true. Makes NO other changes. 
* PUT /messages/:id/edit - Changes a message's content. Automatically changes the edited value to true and changes the date_edited value to the time that this command is run at. All ids, date_created, and is_read are not changed. 
* DELETE /messages/:id - Deletes a specific message from the database. 

# Mixed: 

* GET /users/:id/posts - Gives all posts attributed to that user's id.
* GET /posts/:id/comments - Gives all comments under the specified post. This includes comments made directly on the post as well as all nested replies within comment chains under that post.
* GET /messages/user/:id - Gives all messages to and from a specific user. These are all messages that this user has had with any other user, not just a conversation with one specific user. 
* GET /messages/conversation/:user1/:user2 - GET all messages between two specific users.

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
