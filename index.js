const express = require('express');
const cors = require('cors');
const nodemailer = require("nodemailer");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xlk7a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();
    const database = client.db("ecommerceWebsite");
    const menuCollection = database.collection("menu");
    const cartCollection = database.collection("carts");
    const usersCollection = database.collection("users");
    const adressCollection = database.collection("adress");
    const wishlistCollection = database.collection("wishlist");
    const contactMessages = database.collection("contactMessages");


    app.post("/contact", async (req, res) => {
      const { name, email, phone, message } = req.body;
      console.log("Form Data Received:", { name, email, phone, message });
    
      // Email Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: "Invalid email address." });
      }
    
      // Nodemailer Setup
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    
      const mailOptions = {
        from: email,
        to: process.env.EMAIL_USER,
        subject: `New Contact Form Message from ${name}`,
        text: `You have received a new message from:
        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        Message: ${message}`,
      };
    
      try {
        // Insert the contact message into the MongoDB collection
        const contactMessage = {
          name,
          email,
          phone,
          message,
          createdAt: new Date(), // Add a timestamp
        };
        
        await contactMessages.insertOne(contactMessage);
    
        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info);
        
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error sending email or saving to database:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });




    



    // Menu get
    app.get('/menu', async (req, res) => {
      const cursor = menuCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // New search API for menu items
    app.get('/menu/search/:query', async (req, res) => {
      const { query } = req.params;
      try {
        const meals = await menuCollection.find({
          name: { $regex: query, $options: 'i' }, // Search for name containing the query (case insensitive)
        }).toArray();
        res.json(meals);
      } catch (error) {
        console.error("Error fetching search results:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
    app.delete("/menu/:id" , async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    });

    //menu update
    app.get('/menu/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await menuCollection.findOne(query);
      res.send(result);
    })
    // menu post
    app.post("/menu", async (req, res) => {
      const user = req.body;
      console.log("added", user);
      const result = await menuCollection.insertOne(user);
      res.send(result);
    });



    app.patch('/menu/:id', async (req, res) => {
      const id = req.params.id;
      const item = req.body;
      
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
          $set: {
              name: item.name,
              category: item.category,
              price: item.price,
              recipe: item.recipe, // Recipe field added here
              image: item.image,
          }
      };
      
      const result = await menuCollection.updateOne(filter, updateDoc);
      res.send(result);
  });




    // Product details
    app.get('/menu/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const product = await menuCollection.findOne(query);
      res.json(product);
    });

    // Add to cart
    app.post('/carts', async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await cartCollection.insertOne(user);
      res.send(result);
    });

    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = cartCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // wishlist add
    app.post('/wishlist', async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await wishlistCollection.insertOne(user);
      res.send(result);
    });
    app.get('/wishlist', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = wishlistCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.delete('/wishlist/:id', async (req, res) => {
      const id = req.params.id;
      const queryy = { _id: new ObjectId(id) };
      const result = await wishlistCollection.deleteOne(queryy);
      res.send(result);
    });

    // User related APIs
    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Address related APIs
    app.get('/adress', async (req, res) => {
      const email = req.query.email; // Get the email from the query parameters
      const query = { user: email }; // Query to find addresses for the logged-in user
      const cursor = adressCollection.find(query); // Find all addresses for that user
      const result = await cursor.toArray(); // Convert cursor to array
      res.send(result); // Send the results as the response
    });
    
    app.post('/adress', async (req, res) => {
      const user = req.body;
      console.log(user);
    
      const existingAddress = await adressCollection.findOne({ user: user.user }); // Check if address already exists
      if (existingAddress) {
        return res.status(400).send({ message: 'Address already exists for this user.' }); // Return error if exists
      }
    
      const result = await adressCollection.insertOne(user); // Insert new address
      res.send(result);
    });
    
    // Update address API
    app.put('/adress/:id', async (req, res) => {
      const id = req.params.id;
      const updatedAddress = req.body; // Get the updated address details
    
      const query = { _id: new ObjectId(id) }; // Query to find the address
      const result = await adressCollection.updateOne(query, { $set: updatedAddress }); // Update address
      res.send(result); // Send the result
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close(); // Uncomment this if you want to close the client after running
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Ecommerce website ready');
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
