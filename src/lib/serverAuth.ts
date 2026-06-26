import { getServerSession } from "next-auth";

// Mock user for demonstration purposes
const mockUser = {
  id: "1",
  username: "demo",
  email: "demo@example.com",
  bio: "I Like Manga",
  image: "https://res.cloudinary.com/dyr5sva6n/image/upload/v1702635115/profile/profile_temmit.jpg",
  role: "USER",
  createdAt: new Date().toISOString(),
  bookmarks: [],
  _count: { bookmarks: 0 }
};

const serverAuth = async () => {
  const session = await getServerSession();
  if (!session?.user?.email) {
    throw new Error("Not Sign In");
  }
  
  // In a real app, you would fetch the user from the database
  // For simplicity, we'll just return the mock user if the session email matches
  if (session.user.email === "demo@example.com") {
    return mockUser;
  }
  
  throw new Error("Not Sign In");
};

export default serverAuth;
