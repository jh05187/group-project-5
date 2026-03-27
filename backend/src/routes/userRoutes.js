import express from "express";
import mongoose from "mongoose";
import { attachOptionalAuth, requireAuth } from "../middleware/auth.js";
import { Vote } from "../models/Vote.js";
import { Comment } from "../models/Comment.js";
import { CaseModel } from "../models/Case.js";
import { User } from "../models/User.js";

const router = express.Router();

function buildAnsweredCases(votes) {
  const seen = new Set();
  const answered = [];

  for (const vote of votes) {
    const caseId = vote.caseId?._id?.toString();
    if (!caseId || seen.has(caseId)) continue;
    seen.add(caseId);
    answered.push({
      id: caseId,
      title: vote.caseId?.title || "Unknown case",
      difficulty: vote.caseId?.difficulty || "unknown",
      contentType: vote.caseId?.contentType || "unknown",
      answer: vote.answer,
      isCorrect: vote.isCorrect,
      pointsAwarded: vote.pointsAwarded,
      createdAt: vote.createdAt,
    });
  }

  return answered.slice(0, 12);
}

async function buildUserProfilePayload(user, viewerRole = "public") {
  const [userVotes, commentsCount, publishedCasesCount, recentComments] = await Promise.all([
    Vote.find({ userId: user._id })
      .populate("caseId", "title difficulty contentType")
      .sort({ createdAt: -1 })
      .lean(),
    Comment.countDocuments({ userId: user._id }),
    CaseModel.countDocuments({ isPublished: true }),
    Comment.find({ userId: user._id })
      .populate("caseId", "title")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const recentVotes = userVotes.slice(0, 6);
  const answeredCases = buildAnsweredCases(userVotes);
  const progressPercent = publishedCasesCount
    ? Math.round((user.completedCases.length / publishedCasesCount) * 100)
    : 0;

  const confidenceScore = Math.min(
    100,
    Math.round(user.accuracyRate * 0.7 + Math.min(user.totalVotes, 30) * 1),
  );

  const difficultyBreakdown = {
    easy: { total: 0, correct: 0 },
    medium: { total: 0, correct: 0 },
    hard: { total: 0, correct: 0 },
  };

  for (const vote of userVotes) {
    const difficulty = vote.caseId?.difficulty;
    if (!difficultyBreakdown[difficulty]) continue;
    difficultyBreakdown[difficulty].total += 1;
    if (vote.isCorrect) difficultyBreakdown[difficulty].correct += 1;
  }

  const baseProfile = {
    id: user._id,
    username: user.username,
    role: user.role,
    reputationScore: user.reputationScore,
    level: user.level,
    accuracyRate: user.accuracyRate,
    totalVotes: user.totalVotes,
    correctVotes: user.correctVotes,
    completedCasesCount: user.completedCases.length,
    badges: user.badges,
    commentsCount,
    progressPercent,
    confidenceScore,
    remainingCasesCount: Math.max(0, publishedCasesCount - user.completedCases.length),
    recentPerformance: recentVotes.map((vote) => ({
      id: vote._id,
      caseId: vote.caseId?._id || null,
      isCorrect: vote.isCorrect,
      answer: vote.answer,
      pointsAwarded: vote.pointsAwarded,
      createdAt: vote.createdAt,
      caseTitle: vote.caseId?.title || "Unknown case",
      difficulty: vote.caseId?.difficulty || "unknown",
      contentType: vote.caseId?.contentType || "unknown",
    })),
    answeredCases,
    difficultyBreakdown: Object.entries(difficultyBreakdown).map(([difficulty, stats]) => ({
      difficulty,
      total: stats.total,
      correct: stats.correct,
      accuracyRate: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
    })),
    recentComments: recentComments.map((comment) => ({
      id: comment._id,
      body: comment.body,
      createdAt: comment.createdAt,
      caseId: comment.caseId?._id || null,
      caseTitle: comment.caseId?.title || "Unknown case",
    })),
    joinedAt: user.createdAt,
  };

  if (viewerRole === "self") {
    return {
      ...baseProfile,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    };
  }

  if (viewerRole === "admin") {
    return {
      ...baseProfile,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      adminView: {
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        joinedAt: user.createdAt,
      },
    };
  }

  return baseProfile;
}

router.get("/me", requireAuth, async (req, res) => {
  const user = await buildUserProfilePayload(req.user, "self");
  return res.json({ user });
});

router.get("/:id", attachOptionalAuth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const targetUser = await User.findById(req.params.id).lean();
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const viewerRole =
    req.user?._id?.toString() === targetUser._id.toString()
      ? "self"
      : req.user?.role === "admin"
        ? "admin"
        : "public";

  const user = await buildUserProfilePayload(targetUser, viewerRole);
  return res.json({ user, viewerRole });
});

export default router;
