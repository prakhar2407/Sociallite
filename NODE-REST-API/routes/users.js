const router = require("express").Router();
const User = require("../models/User");

//Update User
router.put("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      res.status(200).json({ message: "Account has been updated" });
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    return res.status(403).json({ message: "Access denied" });
  }
});

//Delete Users
router.delete("/:id", async (req, res) => {
  console.log("Entered Delete User");
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      console.log("Entered Delete User");
      const user = await User.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Account has been Deleted" });
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    return res.status(403).json({ message: "You can't delete your account" });
  }
});

//get a user
router.get("/", async (req, res) => {
  console.log("Entered Get User");
  const userId = req.query.userId;
  console.log(userId);
  console.log("After User id");
  const username = req.query.username;
  console.log(username);
  console.log("After Username");

  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });
    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

//get friends list
router.get("/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.followings.map((friendId) => {
        return User.findById(friendId);
      })
    );
    let friendList = [];
    friends.map((friend) => {
      const { _id, username, profilePicture } = friend;
      friendList.push({ _id, username, profilePicture });
    });
    res.status(200).json(friendList);
  } catch (error) {
    res.status(500).json(error);
  }
});

//Follow a user
router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({
          $push: { followings: req.params.id },
        });
        res.status(200).json({ message: "You are now following this user" });
      } else {
        res
          .status(403)
          .json({ message: "You are already following this user" });
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json({ message: "You can't follow yourself" });
  }
});

//Unfollow
router.put("/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({ $pull: { followers: req.body.userId } });
        await currentUser.updateOne({
          $pull: { followings: req.params.id },
        });
        res.status(200).json({ message: "You have now unfollowed this user" });
      } else {
        res
          .status(403)
          .json({ message: "You already don not follow this user" });
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json({ message: "You can't unfollow yourself" });
  }
});

module.exports = router;
