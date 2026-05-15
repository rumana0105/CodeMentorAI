import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccountPath = 'C:\\Users\\Romana\\OneDrive\\Desktop\\CodeMentorAI\\gen-lang-client-0059090479-6e0f8e43561b.json';
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: firebaseConfig.projectId
});

const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const samplePosts = [
  {
    authorId: "sys_1",
    authorName: "AlexChen",
    authorPhoto: "https://i.pravatar.cc/150?u=1",
    title: "How to solve Two Sum efficiently?",
    content: "I've been trying to solve Two Sum on LeetCode. I have a working O(n^2) solution using a nested loop, but I know there's an O(n) approach using a Hash Map. Can someone explain the intuition behind the Hash Map solution and how it handles duplicates?",
    category: "Problems",
    tags: ["arrays", "hash-table"],
    likes: ["sys_2", "sys_3"],
    replies: [
      {
        id: "reply_1",
        authorId: "sys_2",
        authorName: "PriyaDev",
        content: "The trick is to store the difference (target - current_num) in the map. As you iterate, check if the current number exists in the map! It takes just one pass.",
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    authorId: "sys_2",
    authorName: "PriyaDev",
    authorPhoto: "https://i.pravatar.cc/150?u=2",
    title: "Best resources for Dynamic Programming?",
    content: "DP is currently my weakest area. Every time I see a 2D matrix DP problem, my mind goes blank. Are there any good visualizers or step-by-step guides that helped you finally 'click' with DP?",
    category: "General",
    tags: ["dp", "resources"],
    likes: ["sys_1"],
    replies: [],
    createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    authorId: "sys_3",
    authorName: "Marcus_Tech",
    authorPhoto: "https://i.pravatar.cc/150?u=3",
    title: "Interview experience at TCS",
    content: "Just finished my final round at TCS! The process was surprisingly smooth. The technical round focused heavily on OOP concepts in Java and basic SQL queries (joins, group by). They didn't ask any complex DS/Algo, just string manipulation. HR round was standard. Happy to answer questions!",
    category: "Career",
    tags: ["interview", "tcs"],
    likes: ["sys_1", "sys_2", "sys_4"],
    replies: [
      {
        id: "reply_2",
        authorId: "sys_4",
        authorName: "DevStudent",
        content: "Congrats! Did they ask about your resume projects in depth?",
        createdAt: new Date(Date.now() - 5000000).toISOString() 
      }
    ],
    createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
  },
  {
    authorId: "sys_4",
    authorName: "DevStudent",
    authorPhoto: "https://i.pravatar.cc/150?u=4",
    title: "Sharing my solution for Binary Search",
    content: "I finally nailed the iterative and recursive binary search implementations in Python without any off-by-one errors. The key takeaway for me was to always use `low <= high` and `mid = low + (high - low) // 2` to avoid overflow. Thought I'd share this milestone!",
    category: "Showcase",
    tags: ["algorithms", "python"],
    likes: ["sys_1", "sys_3"],
    replies: [],
    createdAt: new Date(Date.now() - 432000000).toISOString() // 5 days ago
  },
  {
    authorId: "sys_5",
    authorName: "CodeNinja",
    authorPhoto: "https://i.pravatar.cc/150?u=5",
    title: "Why does my React component re-render infinitely?",
    content: "I have a useEffect that updates a state variable, but it's causing an infinite loop. I added the state variable to the dependency array. How do I fix this?",
    category: "General",
    tags: ["react", "hooks"],
    likes: [],
    replies: [],
    createdAt: new Date(Date.now() - 10000000).toISOString() 
  },
  {
    authorId: "sys_6",
    authorName: "SystemArchitect",
    authorPhoto: "https://i.pravatar.cc/150?u=6",
    title: "System Design for a Chat Application",
    content: "If you had to design WhatsApp from scratch, what would your database schema look like? Would you use NoSQL or SQL for storing the messages? Let's discuss trade-offs.",
    category: "Career",
    tags: ["system-design", "database"],
    likes: ["sys_1", "sys_3", "sys_5"],
    replies: [],
    createdAt: new Date(Date.now() - 600000000).toISOString() 
  },
  {
    authorId: "sys_1",
    authorName: "AlexChen",
    authorPhoto: "https://i.pravatar.cc/150?u=1",
    title: "Tips for learning Rust?",
    content: "Coming from a TypeScript/Python background, the borrow checker in Rust is destroying me. Any tips for a beginner to get over this initial hurdle?",
    category: "General",
    tags: ["rust", "learning"],
    likes: ["sys_2"],
    replies: [],
    createdAt: new Date(Date.now() - 700000000).toISOString() 
  },
  {
    authorId: "sys_7",
    authorName: "UI_Wizard",
    authorPhoto: "https://i.pravatar.cc/150?u=7",
    title: "Built a CSS-only animated loader",
    content: "Hey everyone! I just published a codepen with 10 different loading spinners made entirely with CSS keyframes. No JavaScript required. Check it out!",
    category: "Showcase",
    tags: ["css", "ui"],
    likes: ["sys_1", "sys_2", "sys_3", "sys_4"],
    replies: [],
    createdAt: new Date(Date.now() - 800000000).toISOString() 
  },
  {
    authorId: "sys_8",
    authorName: "BugHunter",
    authorPhoto: "https://i.pravatar.cc/150?u=8",
    title: "Dijkstra's Algorithm Implementation Issues",
    content: "My implementation of Dijkstra's algorithm is failing on test cases with disconnected graphs. Should I initialize distances to Infinity or handle unreachable nodes differently?",
    category: "Problems",
    tags: ["graphs", "algorithms"],
    likes: ["sys_5"],
    replies: [],
    createdAt: new Date(Date.now() - 900000000).toISOString() 
  },
  {
    authorId: "sys_9",
    authorName: "DataNerd",
    authorPhoto: "https://i.pravatar.cc/150?u=9",
    title: "Is doing a Master's degree worth it for Data Science?",
    content: "I have 2 years of experience as a Data Analyst and want to transition to a Data Scientist role. Would getting an MS in CS/Data Science be more beneficial than just self-studying and building projects?",
    category: "Career",
    tags: ["data-science", "education"],
    likes: ["sys_2", "sys_6"],
    replies: [],
    createdAt: new Date(Date.now() - 1000000000).toISOString() 
  }
];

async function seedDatabase() {
  console.log("Starting database seed...");
  const forumRef = db.collection('forum_posts');
  
  // First, let's delete existing posts to avoid duplicates if run multiple times
  const snapshot = await forumRef.get();
  const batchDelete = db.batch();
  snapshot.docs.forEach((doc) => {
    batchDelete.delete(doc.ref);
  });
  await batchDelete.commit();
  console.log("Cleared existing posts.");

  // Add new sample posts
  const batchInsert = db.batch();
  samplePosts.forEach((post) => {
    const docRef = forumRef.doc();
    batchInsert.set(docRef, post);
  });
  
  await batchInsert.commit();
  console.log(`Successfully inserted ${samplePosts.length} posts into forum_posts collection!`);
}

seedDatabase().catch(console.error);
