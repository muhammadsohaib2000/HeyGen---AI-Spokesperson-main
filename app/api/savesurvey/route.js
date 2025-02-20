import getMongoClient from "@/app/lib/mongodb";

export async function POST(request) {
  try {
    console.log("i am here")
    // Parse the request body
    const { userName, responses } = await request.json();

    if (!userName) {
      throw new Error("Username is required");
    }

    const client = await getMongoClient();
    const db = client.db("HeygenData");

    if (responses && responses.length > 0) {
      // Update survey responses if provided
      await db.collection("Heygencollection").updateOne(
        { name: userName },
        {
          $push: {
            responses: {
              $each: responses.map((response) => ({
                ...response,
                answeredAt: new Date(),
              })),
            },
          },
        },
        { upsert: true }
      );
    } else {
      // Create a new survey entry if responses are not provided
      await db.collection("Heygencollection").insertOne({
        name: userName,
        responses: [],
        createdAt: new Date(),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error saving survey:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to save survey data",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

