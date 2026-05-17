import { collection, addDoc, getDocs, query, limit } from "firebase/firestore";
import { db } from "./firebase";
import { ForumPost } from "../types";

const REALISTIC_POSTS: Partial<ForumPost>[] = [
  {
    title: "Is Dynamic Programming actually useful in real frontend work?",
    content: "I've been grinding Leetcode and understanding memoization, but honestly, in my 4 years of React development, I've never had to write a DP algorithm. When does this actually come up in web dev?",
    category: "Problems",
    authorName: "ReactNinja",
    authorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=ReactNinja",
    likes: ["user1", "user2", "user3"],
    replies: [
      { id: "r1", authorId: "user4", authorName: "BackendGuru", content: "Rarely in the UI, but if you're building complex data visualizations or rich text editors, tree traversals and DP can occasionally save you.", createdAt: new Date(Date.now() - 3600000).toISOString() }
    ],
    tags: ["React", "Algorithms", "Career"]
  },
  {
    title: "Roast my resume - Applying for FAANG 2026",
    content: "Hey everyone, I've updated my resume to highlight my full-stack MERN projects and my recent open-source contributions to Babel. Be brutally honest, what am I missing?",
    category: "Career",
    authorName: "CodeSlinger",
    authorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=CodeSlinger",
    likes: ["user5"],
    replies: [],
    tags: ["Resume", "FAANG", "Feedback"]
  },
  {
    title: "Just built an AI-powered code reviewer using Gemini!",
    content: "I hooked up the Gemini Pro API to a GitHub action. Every time a PR is opened, it analyzes the diff and posts a comment with potential bugs and refactoring suggestions. Check out the repo!",
    category: "Showcase",
    authorName: "AI_Wizard",
    authorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=AI_Wizard",
    likes: ["user1", "user2", "user3", "user4", "user5", "user6"],
    replies: [
      { id: "r2", authorId: "user1", authorName: "ReactNinja", content: "This is insane! Does it handle context across multiple files?", createdAt: new Date(Date.now() - 1800000).toISOString() }
    ],
    tags: ["AI", "GitHub", "Project"]
  },
  {
    title: "Why does npm install take half my SSD?",
    content: "Seriously. I initialized a blank Vite project, installed Three.js and Tailwind, and suddenly my node_modules is heavier than a black hole. Are we ever fixing this?",
    category: "Off-topic",
    authorName: "DiskSpaceZero",
    authorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=DiskSpace",
    likes: ["user1", "user4", "user7", "user8"],
    replies: [],
    tags: ["Humor", "NPM", "Node"]
  },
  {
    title: "Best resources for System Design in 2026?",
    content: "I feel confident in my coding abilities but system design interviews crush me. What are the best modern resources to learn microservices, Kafka, and distributed databases?",
    category: "General",
    authorName: "ScalingNoob",
    authorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Scaling",
    likes: ["user2", "user9"],
    replies: [],
    tags: ["System Design", "Architecture"]
  }
];

export async function seedCommunityData() {
  try {
    const q = query(collection(db, "community"), limit(1));
    const snap = await getDocs(q);
    
    // Only seed if community collection is empty
    if (snap.empty) {
      console.log("Seeding realistic developer community posts...");
      for (const post of REALISTIC_POSTS) {
        await addDoc(collection(db, "community"), {
          ...post,
          userId: "system_seeder",
          createdAt: new Date().toISOString()
        });
      }
      console.log("Community seeded successfully.");
    }
  } catch (error) {
    console.error("Failed to seed community:", error);
  }
}
