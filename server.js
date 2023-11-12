//////////////// server side////////////
require("dotenv").config();

const express = require("express");
const User = require("./user");
const BlogPost = require("./blog");

const router = express.Router();
const authorize = require("./authorise");
const Adminauthorize = require("./adminAuthorise");
router.use(express.json());

const jwt = require("jsonwebtoken");
router.use(express.json());

////////////authorisation module///////////////////
router.post("/register", async (req, res) => {
  // Our register logic starts here
  try {
    // get input
    const { username, password, email, type } = req.body;

    // validate input
    if (!(username && password && email && type)) {
      return res.status(400).json({ message: "All input is required" });
    }
    //if user already in database
    const oldUser = await User.findOne({ username });

    if (oldUser) {
      return res.status(409).json({ message: "newUser exists, log in" });
    }
    //create new user
    const newUser = await User.create({
      username: username,
      password: password,
      email: email,
      type: type,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!(username && password)) {
      return res.status(400).json({ error: "All inputs required" });
    }

    const user = await User.findOne({ username, password });
    if (user.isBlocked) {
      return res.status(403).json({ error: "User is disabled" });
    }
    console.log(process.env.TOKEN_SECRET);

    if (user) {
      //if password valid then generate token
      console.log(process.env.TOKEN_SECRET);
      const token = jwt.sign(
        { user_id: user._id, username, type: user.type },
        `${process.env.TOKEN_SECRET}`,
        {
          expiresIn: "24h",
        }
      );
      console.log("token:" + token);

      res.status(201).json({ message: "User logged in successfully" });
    } else {
      res.status(400).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message }); // Send the actual error message back to the client
  }
});

router.put("/update/:id", authorize, async (req, res) => {
  const userId = req.params.id;
  const { username, password, email, type } = req.body;

  console.log(username + password + email + type);
  try {
    const user = await User.findByIdAndUpdate(userId, {
      username,
      password,
      email,
      type,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/users/:id", authorize, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    res.status(200).json({ message: "user found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//////////////////////blog post module////////////
// create a blog post
router.post("/blogpost", authorize, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    console.log("User Object:", req.user);

    const owner = req.user.username;

    console.log("yess" + owner);
    const blogPost = new BlogPost({ title, content, owner, category });
    await blogPost.save();
    res.status(201).json(blogPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get all blog posts with pagination and filtering
router.get("/blogpost", authorize, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 1,
      sortBy,
      sortOrder,
      author,
      category,
    } = req.query;

    // build query based on options
    const query = {};
    if (author) {
      query.owner = author;
    }
    if (category) {
      query.category = category;
    }

    // build sort obj based on sortin obje
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    }
    // perform euery+page
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sort,
    };

    const blogPosts = await BlogPost.paginate(query, options);
    res.json(blogPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//get all blog posts
router.get("/blogpost/all/users", authorize, async (req, res) => {
  try {
    const blogPost = await BlogPost.find({ isBlocked: false });
    if (!blogPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json(blogPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update the blogpost by the owner only
router.put("/blogpost/:id", authorize, async (req, res) => {
  try {
    const { title, content } = req.body;
    const Post = await BlogPost.findById(req.params.id);
    if (!Post) {
      return res.status(404).json({ error: "Blog not found" });
    }

    console.log("User Object:", req.user);

    const owner = req.user.username;
    console.log("yess" + owner);

    // if (post.isDisabled) {
    //   return res.status(403).json({ error: "Blog is disabled" });
    // }
    console.log(Post.owner);
    //check if logged in user is the owner
    if (Post.owner !== owner) {
      return res.status(403).json({ error: "you are not the Owner" });
    }
    Post.title = title;
    Post.content = content;

    await Post.save();
    res.status(200).json({ message: "updated successfully" });

    res.json(Post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// delete blogpost by owner
router.delete("/blogpost/:id", authorize, async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);
    if (!blogPost) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (blogPost.owner !== req.user.username) {
      return res.status(403).json({ error: "You are not owner" });
    }
    await blogPost.remove();
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// rate a blog post
router.post("/blog/rate/:id", authorize, async (req, res) => {
  try {
    const { rating } = req.body;
    const userId = req.user.user_id;
    const blogPost = await BlogPost.findById(req.params.id);
    blogPost.ratings.push({ rating, user: userId });
    await blogPost.save();
    res.json(blogPost);
    res.status(200).json({ message: "rated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// comment on a blog post
router.post("/blog/comment/:id", authorize, async (req, res) => {
  try {
    const { text } = req.body;
    const user = req.user.user_id;

    const blogPost = await BlogPost.findById(req.params.id);
    blogPost.comments.push({ text, user: user });
    console.log(req.params.id);
    console.log(user);

    //    const notification = {
    //     type: 'comment',
    //     postId:  req.params.id.toString(),
    //     userId: user.toString(),
    //   };
    //  await User.findByIdAndUpdate(user, {$push:{ notification: notification } });

    await blogPost.save();
    res.status(200).json({ message: "commented successfully" });
    res.json(blogPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

////////////user interaction module/////////////
// follow a blogger
router.post("/users/follow/:blogger", authorize, async (req, res) => {
  try {
    const followerId = req.user.user_id;
    const blogger = req.params.blogger;
    const blogger3 = await User.findById(blogger);

    console.log(followerId + "pp");
    console.log(blogger + "yas");
    console.log(blogger3.username);
    // update the users following list
    await User.findByIdAndUpdate(followerId, {
      $addToSet: { following: blogger },
    });
    // update the bloggers followers list
    await User.findByIdAndUpdate(blogger, {
      $addToSet: { followers: followerId },
    });

    console.log("yaa");
    // fetch bloggers posts
    const bloggerPosts = await BlogPost.find({ owner: blogger3.username });

    console.log(bloggerPosts);

    // extract blog post ids from the bloggers posts
    const blogPostIds = bloggerPosts.map((post) => post._id);
    console.log("omg" + blogPostIds);

    // update the followers feed with blog post ids
    await User.findByIdAndUpdate(followerId, {
      $addToSet: { feed: { $each: blogPostIds } },
    });

    //  // Add a notification to the blogger for the new follower
    // const notification = {
    //   type: 'follower',
    //   userId: followerId,
    // };
    // await User.findByIdAndUpdate(blogger, { $addToSet: { notifications: notification } });

    res.status(200).json({ message: "successfully followed blogger" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get notifications for a user
router.get("/user/notifications/:uId", authorize, async (req, res) => {
  try {
    const userId = req.params.Id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notifications = user.notification;
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/users/feed/:username", authorize, async (req, res) => {
  try {
    const username = req.params.username;

    // Find the user by username and retrieve the 'feed' field
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // extract the post IDs from the 'feed' field
    const postIds = user.feed;
    console.log(postIds);

    // fetch posts from the users feed and populate the 'owner' field
    const feedPosts = await BlogPost.find({ _id: { $in: postIds } });
    console.log("ll" + feedPosts);

    // Format the response
    const formattedFeed = feedPosts.map((post) => ({
      postId: post._id,
      title: post.title,
      content: post.content,
      author: post.owner.username, // Assuming 'owner' is the user ID of the blogger
      category: post.category,
      // Add other fields you want to include in the response
    }));

    res
      .status(200)
      .json({ feed: formattedFeed, message: "Successfully feed shown" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//////////////admin module///////////////

//get all blog posts
router.get("/blogpost/admin/all", Adminauthorize, async (req, res) => {
  try {
    const blogPost = await BlogPost.find({ isBlocked: false });

    if (!blogPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.status(200).json({ message: "successfully retrieved", blogPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//get particular blog post
router.get("/blogpost/:id", Adminauthorize, async (req, res) => {
  try {
    const blogPost = await BlogPost.findOne({
      _id: req.params.id,
      isBlocked: false,
    });
    if (!blogPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.status(200).json({ message: "successfully retrived", blogPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/users", Adminauthorize, async (req, res) => {
  try {
    const users = await User.find({ isBlocked: false });
    res.status(200).json({ message: "successfully retrived", users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
//user block by admin
router.put("/users/:id/block", Adminauthorize, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.isBlocked = true;
    await user.save();
    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//block blog post by admin
router.put("/blogpost/:id/block", Adminauthorize, async (req, res) => {
  try {
    const blogpost = await BlogPost.findById(req.params.id);
    if (!blogpost) {
      return res.status(404).json({ error: "Blog not found" });
    }
    blogpost.isBlocked = true;
    await blogpost.save();
    res.status(200).json({ message: "Post blocked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/////////////search module/////////////
// search blog posts with sorting and filtering options
router.get("/search", async (req, res) => {
  try {
    const {
      keywords,
      category,
      author,
      sortBy,
      sortOrder,
      page = 1,
      limit = 1,
    } = req.query;

    const query = {};

    if (keywords) {
      query.$or = [
        { title: { $regex: keywords, $options: "i" } },
        { content: { $regex: keywords, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (author) {
      query.owner = author;
    }

    const sort = {};

    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sort,
    };

    const searchResults = await BlogPost.paginate(query, options);
    res.status(200).json({ message: "Blog posts retrieved successfully" });
    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
