import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { hash } from 'bcrypt';

dotenv.config();

const MONGODB_NAME = process.env.MONGODB_NAME || "";

const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || "";
const MONGODB_USER = process.env.MONGODB_USER || "";
const superUserEmail = process.env.SUPERUSER_EMAIL || "";
const superUserPassword = process.env.SUPERUSER_PASSWORD || "";

const MONGO_URL = `mongodb://${MONGODB_PASSWORD}:${MONGODB_USER}@mongo:27017`

console.log(MONGO_URL)

// Utility function to log with a timestamp
function log(message) {
    console.log(`${new Date().toISOString()} - ${message}`);
}

// Utility function to log errors with a timestamp
function logError(message) {
    console.error(`${new Date().toISOString()} - ERROR: ${message}`);
}

async function createOrUpdateSuperUser() {
    log("Creating or updating superuser in MongoDB...");
    let mongoClient; // Declare mongoClient outside the try block
    try {
        mongoClient = new MongoClient(MONGO_URL); // Assign it here
        await mongoClient.connect();
        const db = mongoClient.db(MONGODB_NAME);
        const collection = db.collection('users');

        const now = new Date();

        // Hash password only if a new password is provided
        let hashedPassword = null;
        if (superUserPassword) {
            hashedPassword = await hash(superUserPassword, 10);
        }

        // Check if superuser already exists
        const existingUser = await collection.findOne({ role: 'SUPERUSER' });

        if (existingUser) {

            const updateFields = {
                updatedAt: now,
            };

            // If a new email is provided, update it.
            if (superUserEmail) {
                updateFields.email = superUserEmail;
            }

            //If a new password is provided, update the hased password
            if (hashedPassword) {
                updateFields.password = hashedPassword;
            }

            const result = await collection.updateOne({ _id: existingUser._id }, { $set: updateFields });
            log("✅ Superuser actualizado en MongoDB.");
            log(`Update result: ${result}`);

        } else {
            // Create new superuser
            if (!superUserEmail || !superUserPassword) {
                logError("❌ Error creating superuser: Email and password are required.");
                return;
            }

            if (!hashedPassword) {
                hashedPassword = await hash(superUserPassword, 10);
            }

            const superUser = {
                email: superUserEmail,
                password: hashedPassword,
                role: 'SUPERUSER',
                createdAt: now,
                updatedAt: now,
            };

            const result = await collection.insertOne(superUser);
            log("✅ Superuser creado en MongoDB con ID:", result.insertedId);
            log(`Insert result: ${result}`);
        }

    } catch (error) {
        logError(`❌ Error creating/updating superuser: ${error}`);
    } finally {
        if (mongoClient) { // Check if mongoClient is not null
            try {
                await mongoClient.close();
                log("✅ MongoDB client closed.");
            } catch (closeError) {
                logError(`❌ Error closing MongoDB client: ${closeError}`);
            }
        }
    }
}

async function runSetup() {
    log("Starting setup...");
    try {
        await createOrUpdateSuperUser();
        log("✅ Setup complete.");
    } catch (error) {
        logError(`❌ Setup failed: ${error}`);
        process.exit(1);
    }
}

runSetup();