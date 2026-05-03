import mongoose from "mongoose";
import dotenv from "dotenv";
import { MenuItem } from "./models";

dotenv.config();

const menuItems = [
  // Coffee
  {
    name: "Classic Espresso",
    description: "Rich, bold single-shot espresso with a perfect crema. Our signature house blend.",
    price: 3.50,
    category: "Coffee",
    isAvailable: true,
  },
  {
    name: "Café Latte",
    description: "Silky steamed milk poured over a double espresso, topped with a thin layer of microfoam.",
    price: 5.00,
    category: "Coffee",
    isAvailable: true,
  },
  {
    name: "Cappuccino",
    description: "Equal parts espresso, steamed milk, and thick velvety foam. A timeless classic.",
    price: 4.75,
    category: "Coffee",
    isAvailable: true,
  },
  {
    name: "Caramel Macchiato",
    description: "Vanilla-infused steamed milk marked with espresso and drizzled with buttery caramel.",
    price: 5.50,
    category: "Coffee",
    isAvailable: true,
  },
  {
    name: "Cold Brew",
    description: "Slow-steeped for 20 hours. Smooth, naturally sweet, and served over ice.",
    price: 4.50,
    category: "Coffee",
    isAvailable: true,
  },
  {
    name: "Mocha",
    description: "Espresso blended with premium dark chocolate and steamed milk, topped with whipped cream.",
    price: 5.75,
    category: "Coffee",
    isAvailable: true,
  },

  // Tea
  {
    name: "Earl Grey",
    description: "Aromatic black tea infused with bergamot oil. Elegant and refreshing.",
    price: 3.50,
    category: "Tea",
    isAvailable: true,
  },
  {
    name: "Matcha Latte",
    description: "Ceremonial-grade Japanese matcha whisked with steamed oat milk. Earthy and creamy.",
    price: 5.50,
    category: "Tea",
    isAvailable: true,
  },
  {
    name: "Chamomile Blossom",
    description: "Whole chamomile blossoms steeped to perfection. Calming and floral.",
    price: 3.75,
    category: "Tea",
    isAvailable: true,
  },
  {
    name: "Chai Latte",
    description: "House-made spiced chai concentrate with steamed milk. Warm cinnamon and cardamom notes.",
    price: 5.00,
    category: "Tea",
    isAvailable: true,
  },

  // Pastry
  {
    name: "Butter Croissant",
    description: "Flaky, golden French-style croissant with layers of pure butter. Baked fresh daily.",
    price: 3.75,
    category: "Pastry",
    isAvailable: true,
  },
  {
    name: "Almond Danish",
    description: "Puff pastry filled with frangipane cream, topped with sliced almonds and powdered sugar.",
    price: 4.25,
    category: "Pastry",
    isAvailable: true,
  },
  {
    name: "Blueberry Muffin",
    description: "Moist muffin bursting with fresh blueberries and a crumbly streusel top.",
    price: 3.50,
    category: "Pastry",
    isAvailable: true,
  },
  {
    name: "Cinnamon Roll",
    description: "Soft, swirled dough with cinnamon-brown sugar filling and cream cheese glaze.",
    price: 4.50,
    category: "Pastry",
    isAvailable: true,
  },

  // Sandwich
  {
    name: "Caprese Panini",
    description: "Fresh mozzarella, vine-ripened tomatoes, and basil pesto on pressed ciabatta.",
    price: 8.50,
    category: "Sandwich",
    isAvailable: true,
  },
  {
    name: "Turkey Club",
    description: "Roasted turkey, crispy bacon, avocado, and herb aioli on toasted sourdough.",
    price: 9.50,
    category: "Sandwich",
    isAvailable: true,
  },
  {
    name: "Grilled Veggie Wrap",
    description: "Roasted vegetables with hummus, feta cheese, and arugula in a spinach tortilla.",
    price: 8.00,
    category: "Sandwich",
    isAvailable: true,
  },

  // Beverage
  {
    name: "Fresh Orange Juice",
    description: "Freshly squeezed from Valencia oranges. Pure sunshine in a glass.",
    price: 4.50,
    category: "Beverage",
    isAvailable: true,
  },
  {
    name: "Berry Smoothie",
    description: "Mixed berries blended with Greek yogurt, honey, and a splash of almond milk.",
    price: 6.00,
    category: "Beverage",
    isAvailable: true,
  },
  {
    name: "Sparkling Water",
    description: "Premium sparkling mineral water with a choice of lemon or lime.",
    price: 2.50,
    category: "Beverage",
    isAvailable: true,
  },

  // Dessert
  {
    name: "Tiramisu",
    description: "Classic Italian dessert with layers of mascarpone, espresso-soaked ladyfingers, and cocoa.",
    price: 7.50,
    category: "Dessert",
    isAvailable: true,
  },
  {
    name: "Chocolate Brownie",
    description: "Rich, fudgy dark chocolate brownie served warm with a scoop of vanilla gelato.",
    price: 6.50,
    category: "Dessert",
    isAvailable: true,
  },
  {
    name: "Crème Brûlée",
    description: "Silky vanilla custard with a caramelized sugar crust. Made with Tahitian vanilla.",
    price: 7.00,
    category: "Dessert",
    isAvailable: true,
  },
];

const seedDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/the-blue-cup";
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB for seeding");

    // Clear existing menu items
    await MenuItem.deleteMany({});
    console.log("🗑️  Cleared existing menu items");

    // Insert seed data
    const inserted = await MenuItem.insertMany(menuItems);
    console.log(`🌱 Seeded ${inserted.length} menu items`);

    // Seed default Admin User
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const User = (await import("./models")).User;
    
    await User.deleteMany({});
    await User.create({
      email: "admin@thebluecup.com",
      password: hashedPassword,
      role: "admin"
    });
    console.log("👑 Seeded default admin user: admin@thebluecup.com / admin123");

    console.log("\n📋 Categories seeded:");
    const categories = [...new Set(menuItems.map((i) => i.category))];
    for (const cat of categories) {
      const count = menuItems.filter((i) => i.category === cat).length;
      console.log(`   ${cat}: ${count} items`);
    }

    await mongoose.disconnect();
    console.log("\n✅ Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDB();
