require("dotenv").config();
const connectDB = require("../config/db");
const Product = require("../models/Product");
const Review = require("../models/Review");

const categories = [
  "Puja Decorations",
  "Wedding Stage Decoration",
  "Birthday Decoration",
  "Festive Lighting",
  "Floral Decoration"
];

const eventTypes = [
  "Durga Puja",
  "Diwali",
  "Kali Puja",
  "Saraswati Puja",
  "Wedding Decoration",
  "Birthday Decoration",
  "Special Events"
];

const adjectives = ["Royal", "Premium", "Grand", "Elegant", "Heritage", "Luxury", "Classic", "Modern"];

function buildProducts(total) {
  const data = [];
  for (let i = 1; i <= total; i += 1) {
    const priceMin = 999 + (i % 10) * 900;
    const priceMax = i % 21 === 0 ? 50000 + (i % 5) * 2500 : priceMin + 5000 + (i % 7) * 1900;
    data.push({
      title: `${adjectives[i % adjectives.length]} ${eventTypes[i % eventTypes.length]} ${categories[i % categories.length]} Package`,
      category: categories[i % categories.length],
      eventType: eventTypes[i % eventTypes.length],
      description: "Complete decoration setup including stage backdrop, festive lighting, floral styling and on-ground execution team.",
      priceMin,
      priceMax,
      rating: Number((4 + (i % 10) * 0.1).toFixed(1)),
      popularity: i % 3 === 0 ? "high" : i % 2 === 0 ? "medium" : "new",
      totalBookings: Math.max(2, 1200 - i),
      isBestSelling: i % 10 === 0
    });
  }
  return data;
}

async function seed() {
  await connectDB();
  await Product.deleteMany({});
  await Review.deleteMany({});

  await Product.insertMany(buildProducts(1200));
  await Review.insertMany([
    { name: "Priyanka Sen", rating: 5, reviewText: "Amazing Durga Puja decoration! Highly recommended.", eventType: "Durga Puja" },
    { name: "Arjun & Meera", rating: 5, reviewText: "Elegant wedding stage and flawless execution.", eventType: "Wedding Decoration" },
    { name: "S. Chatterjee", rating: 4.5, reviewText: "Beautiful birthday setup, great team and value.", eventType: "Birthday Decoration" }
  ]);

  console.log("Seed complete: 1200 products + featured reviews");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
