//////////////user schema//////////
const mongoose = require("mongoose");

const User = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  followers: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    default: [],
  },
  following: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    default: [],
  },
  feed: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BlogPost",
      },
    ],
    default: [],
  },
  notification: {
    type: [
      {
        type: String, // 'follower' or 'comment'
        postId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "BlogPost",
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    default: [],
  },
});

//define user model
module.exports = mongoose.model("User", User);
