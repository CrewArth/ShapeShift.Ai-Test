const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://arthvala:arthvala15@shapeshiftai.xiyoj.mongodb.net/?retryWrites=true&w=majority&appName=ShapeShiftAI";
const client = new MongoClient(uri);

async function run() {
  try {
    console.error("Connecting to MongoDB...");
    await client.connect();
    console.error("Connected successfully to MongoDB");

    const database = client.db("shapeshiftai");
    console.error("Accessed database");

    const collections = await database.listCollections().toArray();
    console.error("Collections:", collections.map(c => c.name));

    await client.db("admin").command({ ping: 1 });
    console.error("Pinged deployment. Connection confirmed!");

  } finally {
    await client.close();
    console.error("Connection closed");
  }
}

run().catch(console.error); 