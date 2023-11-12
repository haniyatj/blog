//////////////blog schema//////////
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    ref: "User",
    required: true,
  },
  comments: {
    type: [
      {
        text: String,
        user: {
          type: String,
          ref: "User",
        },
      },
    ],
    default: [],
  },
  ratings: {
    type: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          required: true,
        },
      },
    ],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  isBlocked: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    required: true,
    default: "none",
  },
});
blogPostSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("BlogPost", blogPostSchema);
