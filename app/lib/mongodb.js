import { MongoClient, ServerApiVersion } from "mongodb";

const uri =
  "mongodb+srv://nmurray:XcQbc17zhOuCBYrT@heygen.efslb.mongodb.net/?retryWrites=true&w=majority&appName=Heygen";


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: false,
    },
  });
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export default async function getMongoClient() {
  if (typeof window !== "undefined") {
    throw new Error("MongoDB should only be used on the server side.");
  }
  return clientPromise;
}
