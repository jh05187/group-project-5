import express from "express";
import mongoose from "mongoose";
import { CaseModel } from "../models/Case.js";
import { Comment } from "../models/Comment.js";
import { User } from "../models/User.js";
import { Vote } from "../models/Vote.js";
import { LeaderboardGroup } from "../models/LeaderboardGroup.js";
import { PendingSignup } from "../models/PendingSignup.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/overview", async (req, res) => {
  const [totalUsers, totalCases, publishedCases, totalComments, totalVotes, newestUsers] =
    await Promise.all([
      User.countDocuments({}),
      CaseModel.countDocuments({}),
      CaseModel.countDocuments({ isPublished: true }),
      Comment.countDocuments({}),
      Vote.countDocuments({}),
      User.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("username email createdAt role")
        .lean(),
    ]);

  return res.json({
    stats: {
      totalUsers,
      totalCases,
      publishedCases,
      totalComments,
      totalVotes,
      unpublishedCases: totalCases - publishedCases,
    },
    newestUsers: newestUsers.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })),
  });
});

router.get("/cases", async (req, res) => {
  const cases = await CaseModel.find({})
    .sort({ createdAt: -1 })
    .populate("createdBy", "username")
    .lean();
  return res.json({ cases });
});

router.post("/cases", async (req, res) => {
  const {
    title,
    contentType,
    content,
    senderInfo = "",
    links = [],
    difficulty = "easy",
    correctAnswer,
    explanation,
    tags = [],
    isPublished = false,
  } = req.body;

  if (!title || !contentType || !content || !correctAnswer || !explanation) {
    return res.status(400).json({ error: "Missing required case fields" });
  }

  const caseItem = await CaseModel.create({
    title,
    contentType,
    content,
    senderInfo,
    links,
    difficulty,
    correctAnswer,
    explanation,
    tags,
    isPublished,
    createdBy: req.user._id,
  });

  return res.status(201).json({ case: caseItem });
});

router.patch("/cases/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid case id" });
  }

  const caseItem = await CaseModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!caseItem) return res.status(404).json({ error: "Case not found" });
  return res.json({ case: caseItem });
});

router.delete("/cases/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid case id" });
  }

  const deleted = await CaseModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Case not found" });

  await Promise.all([
    Vote.deleteMany({ caseId: deleted._id }),
    Comment.deleteMany({ caseId: deleted._id }),
  ]);

  return res.status(204).send();
});

router.get("/comments", async (req, res) => {
  const comments = await Comment.find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("userId", "username email")
    .populate("caseId", "title")
    .lean();

  return res.json({
    comments: comments.map((comment) => ({
      id: comment._id,
      body: comment.body,
      createdAt: comment.createdAt,
      user: comment.userId
        ? {
            id: comment.userId._id,
            username: comment.userId.username,
            email: comment.userId.email,
          }
        : null,
      case: comment.caseId
        ? {
            id: comment.caseId._id,
            title: comment.caseId.title,
          }
        : null,
    })),
  });
});

router.delete("/comments/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid comment id" });
  }

  const deleted = await Comment.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Comment not found" });

  return res.status(204).send();
});

router.delete("/users/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({ error: "Admins cannot delete their own account here" });
  }

  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "User not found" });

  await Promise.all([
    Vote.deleteMany({ userId: deleted._id }),
    Comment.deleteMany({ userId: deleted._id }),
    PendingSignup.deleteMany({ email: deleted.email }),
    LeaderboardGroup.updateMany({}, { $pull: { members: deleted._id } }),
    LeaderboardGroup.deleteMany({ createdBy: deleted._id }),
  ]);

  return res.status(204).send();
});

router.get("/users", async (req, res) => {
  const users = await User.find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .select("username email role createdAt reputationScore level accuracyRate totalVotes")
    .lean();

  return res.json({
    users: users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      reputationScore: user.reputationScore,
      level: user.level,
      accuracyRate: user.accuracyRate,
      totalVotes: user.totalVotes,
    })),
  });
});

router.get("/users/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const user = await User.findById(req.params.id)
    .select(
      "username email role createdAt reputationScore level accuracyRate totalVotes correctVotes badges completedCases isEmailVerified",
    )
    .lean();

  if (!user) return res.status(404).json({ error: "User not found" });

  const [commentsCount, recentVotes] = await Promise.all([
    Comment.countDocuments({ userId: user._id }),
    Vote.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("caseId", "title difficulty contentType")
      .lean(),
  ]);

  return res.json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      reputationScore: user.reputationScore,
      level: user.level,
      accuracyRate: user.accuracyRate,
      totalVotes: user.totalVotes,
      correctVotes: user.correctVotes,
      completedCasesCount: user.completedCases.length,
      badges: user.badges,
      commentsCount,
      isEmailVerified: user.isEmailVerified,
      recentVotes: recentVotes.map((vote) => ({
        id: vote._id,
        createdAt: vote.createdAt,
        answer: vote.answer,
        isCorrect: vote.isCorrect,
        pointsAwarded: vote.pointsAwarded,
        caseTitle: vote.caseId?.title || "Unknown case",
        difficulty: vote.caseId?.difficulty || "unknown",
        contentType: vote.caseId?.contentType || "unknown",
      })),
    },
  });
});

export default router;
