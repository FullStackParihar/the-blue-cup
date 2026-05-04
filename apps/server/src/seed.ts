import mongoose from "mongoose";
import dotenv from "dotenv";
import { MenuItem } from "./models";

dotenv.config();

const menuItems = [
  // Tea
  { name: "Mix Chai", description: "Our signature house blend of premium tea leaves and secret spices.", price: 30, category: "Tea", isAvailable: true },
  { name: "Adrak Chai", description: "Freshly crushed ginger brewed with strong tea for a refreshing kick.", price: 30, category: "Tea", isAvailable: true },
  { name: "Masala Chai", description: "A fragrant blend of cardamom, cinnamon, and cloves in rich milk tea.", price: 30, category: "Tea", isAvailable: true },
  { name: "Elaichi Chai", description: "Delicate and aromatic tea infused with premium green cardamom.", price: 30, category: "Tea", isAvailable: true },
  { name: "Black Chai", description: "Strong, pure black tea brewed to perfection for a bold start.", price: 30, category: "Tea", isAvailable: true },
  { name: "Green Tea", description: "Light and healthy antioxidant-rich tea with subtle earthy notes.", price: 40, category: "Tea", isAvailable: true },
  { name: "Lemon Tea", description: "Zesty and refreshing tea with a perfect balance of citrus and honey.", price: 40, category: "Tea", isAvailable: true },
  { name: "Kesar Chai", description: "Luxurious tea infused with premium Kashmiri saffron strands.", price: 65, category: "Tea", isAvailable: true },

  // Coffee
  { name: "Regular Hot Coffee", description: "Classic smooth coffee brewed from freshly roasted beans.", price: 50, category: "Coffee", isAvailable: true },
  { name: "Black Coffee", description: "Pure, bold, and intense coffee for the true connoisseur.", price: 60, category: "Coffee", isAvailable: true },
  { name: "Hot Nutella", description: "Creamy steamed milk blended with rich Nutella hazelnut spread.", price: 100, category: "Coffee", isAvailable: true },
  { name: "Belgian Hot Chocolate", description: "Decadent melted Belgian chocolate with velvety steamed milk.", price: 80, category: "Coffee", isAvailable: true },
  { name: "Cold Coffee with Ice Cream", description: "Thick, creamy cold coffee topped with a scoop of vanilla bean ice cream.", price: 100, category: "Coffee", isAvailable: true },
  { name: "Double Choco Chips Frappe", description: "Ice-blended coffee with chocolate chips and rich cocoa drizzle.", price: 130, category: "Coffee", isAvailable: true },
  { name: "Hazelnut Frappe", description: "Smooth ice-blended coffee with a premium hazelnut syrup twist.", price: 130, category: "Coffee", isAvailable: true },
  { name: "Iced Americano Coffee", description: "Bold espresso shots poured over ice and chilled water.", price: 90, category: "Coffee", isAvailable: true },

  // Ice Tea
  { name: "Peach Ice Tea", description: "Sweet and floral peach infusion served chilled over ice.", price: 80, category: "Ice Tea", isAvailable: true },
  { name: "Mango Ice Tea", description: "Tropical mango nectar blended with refreshing iced tea.", price: 80, category: "Ice Tea", isAvailable: true },
  { name: "Strawberry Ice Tea", description: "Bright strawberry flavors with a crisp tea finish.", price: 80, category: "Ice Tea", isAvailable: true },
  { name: "Watermelon Ice Tea", description: "Hydrating watermelon sweetness in a chilled tea base.", price: 80, category: "Ice Tea", isAvailable: true },
  { name: "Lemon Ice Tea", description: "The classic zesty refresher with a hint of mint.", price: 80, category: "Ice Tea", isAvailable: true },
  { name: "Redbull Ice Tea", description: "An energizing twist of Redbull mixed with our signature iced tea.", price: 180, category: "Ice Tea", isAvailable: true },

  // Mocktails
  { name: "Masala Lemonade", description: "Spiced Indian-style lemonade with black salt and cumin.", price: 60, category: "Mocktails", isAvailable: true },
  { name: "Virgin Mojito", description: "Classic mint and lime refresher with sparkling soda.", price: 80, category: "Mocktails", isAvailable: true },
  { name: "Watermelon Mojito", description: "Fresh watermelon chunks muddled with mint and lime.", price: 80, category: "Mocktails", isAvailable: true },
  { name: "Mango Mojito", description: "Tropical mango puree with zesty lime and fresh mint.", price: 80, category: "Mocktails", isAvailable: true },
  { name: "Pacific Blue", description: "Stunning blue curacao mocktail with a citrusy sparkle.", price: 80, category: "Mocktails", isAvailable: true },

  // Shakes
  { name: "Vanilla Shake", description: "Creamy classic vanilla bean shake blended to perfection.", price: 79, category: "Shakes", isAvailable: true },
  { name: "Black Current Shake", description: "Exotic black currant fruit blend with rich creamy milk.", price: 99, category: "Shakes", isAvailable: true },
  { name: "Strawberry Shake", description: "Fresh strawberry sweetness in a thick, velvety shake.", price: 99, category: "Shakes", isAvailable: true },
  { name: "Dark Chocolate Shake", description: "Intense dark cocoa blended for the ultimate chocolate lover.", price: 99, category: "Shakes", isAvailable: true },
  { name: "Kitkat Shake", description: "Thick shake blended with crunchy Kitkat wafer bars.", price: 99, category: "Shakes", isAvailable: true },
  { name: "Oreo Shake", description: "The ultimate cookies and cream delight with crushed Oreos.", price: 99, category: "Shakes", isAvailable: true },
  { name: "Butterscotch Shake", description: "Rich butterscotch crunch in a creamy caramel-infused shake.", price: 99, category: "Shakes", isAvailable: true },

  // Breads
  { name: "OTC Garlic Bread", description: "Toasted bread topped with Onion, Tomato, Capsicum and garlic butter.", price: 130, category: "Breads", isAvailable: true },
  { name: "Cheese Garlic Bread", description: "Classic garlic bread loaded with melted mozzarella cheese.", price: 140, category: "Breads", isAvailable: true },
  { name: "Chilli Cheese Garlic Bread", price: 150, description: "Spicy green chillies and melted cheese on garlic-infused toast.", category: "Breads", isAvailable: true },
  { name: "Paneer Garlic Bread", description: "Diced marinated paneer and cheese on crunchy garlic bread.", price: 150, category: "Breads", isAvailable: true },

  // Burger
  { name: "Aloo Tikki Burger", description: "Crispy potato patty with special herbs and classic dressing.", price: 60, category: "Burger", isAvailable: true },
  { name: "Veg Cheese Burger", description: "Mixed veg patty with a thick slice of melting cheese.", price: 80, category: "Burger", isAvailable: true },
  { name: "Veg Burger", description: "Classic vegetable patty burger with fresh lettuce and mayo.", price: 70, category: "Burger", isAvailable: true },
  { name: "Paneer Veg Burger", description: "Grilled paneer steak with fresh veggies and spicy sauce.", price: 100, category: "Burger", isAvailable: true },
  { name: "Paneer Burger With Fries", description: "Hearty paneer burger served with a side of golden fries.", price: 120, category: "Burger", isAvailable: true },

  // Pav & Fries
  { name: "Toast (2 Pc)", description: "Perfectly buttered and toasted bread slices.", price: 35, category: "Pav & Fries", isAvailable: true },
  { name: "Maska Bun Normal", description: "Soft bun loaded with a generous amount of fresh butter.", price: 50, category: "Pav & Fries", isAvailable: true },
  { name: "Maska Bun Grilled", description: "Grilled buttery bun with a crispy exterior and soft core.", price: 50, category: "Pav & Fries", isAvailable: true },
  { name: "Vada Pav", description: "The classic Mumbai street food - spicy potato fritter in a bun.", price: 59, category: "Pav & Fries", isAvailable: true },
  { name: "Cheese Vada Pav", description: "Classic Vada Pav elevated with a slice of melting cheese.", price: 69, category: "Pav & Fries", isAvailable: true },
  { name: "Cheese Onion Vada Pav", description: "Vada Pav with crunchy onions and rich melted cheese.", price: 79, category: "Pav & Fries", isAvailable: true },
  { name: "French Fries", description: "Classic salted golden crispy potato fries.", price: 79, category: "Pav & Fries", isAvailable: true },
  { name: "Peri Peri Fries", description: "Golden fries tossed in spicy and tangy peri-peri seasoning.", price: 99, category: "Pav & Fries", isAvailable: true },
  { name: "Loaded Fries", description: "Fries topped with cheese sauce, jalapenos, and diced veggies.", price: 129, category: "Pav & Fries", isAvailable: true },
  { name: "Cheese Nachos", description: "Crunchy corn tortillas topped with warm cheese sauce and salsa.", price: 149, category: "Pav & Fries", isAvailable: true },
  { name: "Paneer 65", description: "Spicy, deep-fried paneer cubes tossed in curry leaves and spices.", price: 179, category: "Pav & Fries", isAvailable: true },

  // Sandwich
  { name: "Veg Sandwich", description: "Fresh garden vegetables with green chutney in soft bread.", price: 60, category: "Sandwich", isAvailable: true },
  { name: "Grilled Sandwich", description: "Triple-layered vegetable sandwich grilled to perfection.", price: 80, category: "Sandwich", isAvailable: true },
  { name: "Corn Cheese Sandwich", description: "Sweet corn and gooey mozzarella cheese in grilled bread.", price: 100, category: "Sandwich", isAvailable: true },
  { name: "Tandoori Paneer Sandwich", description: "Smoky tandoori marinated paneer with spicy mayo.", price: 110, category: "Sandwich", isAvailable: true },
  { name: "Paneer Tandoori Sandwich", description: "Premium grilled sandwich with chunks of tandoori paneer.", price: 120, category: "Sandwich", isAvailable: true },
  { name: "Peri Peri Sandwich", description: "Spicy peri-peri seasoned veggies and cheese in grilled toast.", price: 120, category: "Sandwich", isAvailable: true },

  // Pasta
  { name: "Red Sauce Pasta", description: "Penne pasta in a tangy and spicy tomato-basil sauce.", price: 110, category: "Pasta", isAvailable: true },
  { name: "White Sauce Pasta", description: "Creamy and cheesy alfredo-style pasta with Italian herbs.", price: 130, category: "Pasta", isAvailable: true },
  { name: "Pink Sauce Pasta", description: "The best of both worlds - a creamy tomato rose sauce blend.", price: 150, category: "Pasta", isAvailable: true },

  // Pizza
  { name: "Corn Pizza (8 inch)", description: "8\" thin crust pizza topped with sweet corn and extra cheese.", price: 120, category: "Pizza", isAvailable: true },
  { name: "Corn Pizza (10 inch)", description: "10\" thin crust pizza topped with sweet corn and extra cheese.", price: 199, category: "Pizza", isAvailable: true },
  { name: "Onion Pizza (8 inch)", description: "8\" pizza topped with crunchy onions and signature sauce.", price: 120, category: "Pizza", isAvailable: true },
  { name: "Onion Pizza (10 inch)", description: "10\" pizza topped with crunchy onions and signature sauce.", price: 199, category: "Pizza", isAvailable: true },
  { name: "Capsicum Pizza (8 inch)", description: "8\" pizza with fresh green capsicum and mozzarella.", price: 120, category: "Pizza", isAvailable: true },
  { name: "Capsicum Pizza (10 inch)", description: "10\" pizza with fresh green capsicum and mozzarella.", price: 199, category: "Pizza", isAvailable: true },
  { name: "Tomato Pizza (8 inch)", description: "8\" pizza topped with juicy tomatoes and Italian herbs.", price: 120, category: "Pizza", isAvailable: true },
  { name: "Tomato Pizza (10 inch)", description: "10\" pizza topped with juicy tomatoes and Italian herbs.", price: 199, category: "Pizza", isAvailable: true },
  { name: "Onion Paneer Pizza (8 inch)", description: "8\" pizza with marinated paneer cubes and crunchy onions.", price: 130, category: "Pizza", isAvailable: true },
  { name: "Onion Paneer Pizza (10 inch)", description: "10\" pizza with marinated paneer cubes and crunchy onions.", price: 199, category: "Pizza", isAvailable: true },
  { name: "Red Pepper Corn Pizza (8 inch)", description: "8\" pizza with red paprika, sweet corn, and spicy sauce.", price: 150, category: "Pizza", isAvailable: true },
  { name: "Red Pepper Corn Pizza (10 inch)", description: "10\" pizza with red paprika, sweet corn, and spicy sauce.", price: 220, category: "Pizza", isAvailable: true },
  { name: "OTC Pizza (8 inch)", description: "8\" pizza loaded with Onion, Tomato, and Capsicum.", price: 180, category: "Pizza", isAvailable: true },
  { name: "OTC Pizza (10 inch)", description: "10\" pizza loaded with Onion, Tomato, and Capsicum.", price: 249, category: "Pizza", isAvailable: true },
  { name: "Tandoori Paneer Pizza (8 inch)", description: "8\" pizza with smoky tandoori paneer and spicy drizzle.", price: 199, category: "Pizza", isAvailable: true },
  { name: "Tandoori Paneer Pizza (10 inch)", description: "10\" pizza with smoky tandoori paneer and spicy drizzle.", price: 249, category: "Pizza", isAvailable: true },
  { name: "Veggie Blast Pizza (8 inch)", description: "8\" pizza loaded with all garden fresh vegetables.", price: 199, category: "Pizza", isAvailable: true },
  { name: "Veggie Blast Pizza (10 inch)", description: "10\" pizza loaded with all garden fresh vegetables.", price: 249, category: "Pizza", isAvailable: true },
  { name: "TBC Special Pizza", description: "Our chef's signature 10\" pizza with premium toppings and extra cheese.", price: 299, category: "Pizza", isAvailable: true },

  // Cafe Special
  { name: "Cheese Nuggets", description: "Crispy breaded nuggets filled with molten cheese.", price: 110, category: "Cafe Special", isAvailable: true },
  { name: "Cheese Rice Cutlet", description: "Hearty rice and cheese cutlets with traditional spices.", price: 110, category: "Cafe Special", isAvailable: true },
  { name: "Cheese Corn Cutlet", description: "Golden fried cutlets with sweet corn and melting cheese.", price: 120, category: "Cafe Special", isAvailable: true },

  // Momo
  { name: "Veg Momo (Steam)", description: "Healthy steamed dumplings filled with minced vegetables.", price: 80, category: "Momo", isAvailable: true },
  { name: "Veg Momo (Fried)", description: "Crispy deep-fried dumplings with a savory veg filling.", price: 100, category: "Momo", isAvailable: true },
  { name: "Veg Momo (Crunchy)", description: "Extra crunchy breaded momos served with spicy chutney.", price: 120, category: "Momo", isAvailable: true },
  { name: "Veg Gravy Momo", description: "Momos tossed in a rich and spicy signature gravy.", price: 100, category: "Momo", isAvailable: true },

  // Maggi
  { name: "Plain Maggi", description: "The classic comforting bowl of masala noodles.", price: 60, category: "Maggi", isAvailable: true },
  { name: "Veg Maggi", description: "Maggi loaded with fresh peas, carrots, and beans.", price: 89, category: "Maggi", isAvailable: true },
  { name: "Cheese Maggi", description: "Creamy Maggi noodles topped with grated cheese.", price: 99, category: "Maggi", isAvailable: true },
  { name: "Masala Veggie Maggi", description: "Extra spicy Maggi with a double dose of masala and veggies.", price: 99, category: "Maggi", isAvailable: true },
  { name: "Makhani Maggi", description: "Maggi in a rich, buttery, and creamy tomato makhani sauce.", price: 99, category: "Maggi", isAvailable: true },
  { name: "Peri Peri Masala Maggi", description: "Fiery Maggi with a zesty peri-peri spice blend.", price: 99, category: "Maggi", isAvailable: true },
  { name: "Tandoori Maggi", description: "Maggi noodles with a smoky tandoori flavor twist.", price: 99, category: "Maggi", isAvailable: true },

  // Rolls
  { name: "Veg Roll", description: "Warm tortilla rolled with spiced vegetables and sauces.", price: 69, category: "Rolls", isAvailable: true },
  { name: "Paneer Roll", description: "Marinated paneer chunks with veggies wrapped in a soft roll.", price: 89, category: "Rolls", isAvailable: true },

  // Dessert
  { name: "Choco Lava Cake", description: "Warm chocolate cake with a molten lava center.", price: 99, category: "Dessert", isAvailable: true },
  { name: "Choco Brownie", description: "Rich, fudgy chocolate brownie with walnuts.", price: 129, category: "Dessert", isAvailable: true },
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
