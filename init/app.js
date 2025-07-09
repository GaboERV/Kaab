import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import { hash } from 'bcrypt';

dotenv.config();

// --- Configuration ---
const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8086';
const INFLUX_USERNAME = process.env.INFLUX_USERNAME || 'admin';
const INFLUX_PASSWORD = process.env.INFLUX_PASSWORD || 'admin123';
const MONGO_INITDB_ROOT_USERNAME = process.env.MONGO_INITDB_ROOT_USERNAME
const MONGO_INITDB_ROOT_PASSWORD = process.env.MONGO_INITDB_ROOT_PASSWORD
const MONGODB_NAME = process.env.MONGODB_NAME || "";
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || "";
const MONGODB_USER = process.env.MONGODB_USER || "";
const SUPERUSER_EMAIL = process.env.SUPERUSER_EMAIL || "";
const SUPERUSER_PASSWORD = process.env.SUPERUSER_PASSWORD || "";
const MONGODB_NEW_USER = process.env.MONGODB_NEW_USER || "newuser"; // New MongoDB user
const MONGODB_NEW_PASSWORD = process.env.MONGODB_NEW_PASSWORD || "newpassword"; // New MongoDB password
const MONGO_URL = `mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongo:27017`;
const TOKEN_COLLECTION = 'influxdb_tokens'; // Collection name for tokens

// --- Logging ---
function log(message) {
    console.log(`${new Date().toISOString()} - ${message}`);
}

function logError(message) {
    console.error(`${new Date().toISOString()} - ERROR: ${message}`);
}

// --- MongoDB: Create New User ---
// --- MongoDB: Create New User ---
async function createMongoDBUser(dbName, username, password) {
  let mongoClient;
  try {
    mongoClient = new MongoClient(MONGO_URL); // Connect as admin
    await mongoClient.connect();
    const db = mongoClient.db(dbName);

    // Use db.command({ createUser: ... })
    await db.command({
      createUser: username,
      pwd: password,
      roles: [{ role: "readWrite", db: dbName }]
    });

    log(`✅ MongoDB user ${username} created successfully in database ${dbName}`);
    return true;

  } catch (error) {
    logError(`❌ Error creating MongoDB user: ${error.message}`);
    return false;
  } finally {
    if (mongoClient) {
      try {
        await mongoClient.close();
        log("✅ MongoDB client closed after creating user.");
      } catch (closeError) {
        logError(`❌ Error closing MongoDB client: ${closeError}`);
      }
    }
  }
}

// --- MongoDB: Check for existing token ---
async function getExistingTokenFromMongo(orgID) {
    let mongoClient;
    try {
        mongoClient = new MongoClient(MONGO_URL);
        await mongoClient.connect();
        const db = mongoClient.db(MONGODB_NAME);
        const tokensCollection = db.collection(TOKEN_COLLECTION);

        const existingTokenDoc = await tokensCollection.findOne({ orgID: orgID });

        if (existingTokenDoc) {
            log(`✅ Found existing token in MongoDB for orgID: ${orgID}`);
            return existingTokenDoc.token;
        } else {
            log(`❌ No existing token found in MongoDB for orgID: ${orgID}`);
            return null;
        }
    } catch (error) {
        logError(`❌ Error checking for existing token in MongoDB: ${error.message}`);
        return null;
    } finally {
        if (mongoClient) {
            try {
                await mongoClient.close();
                log("✅ MongoDB client closed after checking existing token.");
            } catch (closeError) {
                logError(`❌ Error closing MongoDB client: ${closeError}`);
            }
        }
    }
}

// --- MongoDB: Save Token ---
async function saveTokenToMongo(orgID, token) {
    let mongoClient;
    try {
        mongoClient = new MongoClient(MONGO_URL);
        await mongoClient.connect();
        const db = mongoClient.db(MONGODB_NAME);
        const tokensCollection = db.collection(TOKEN_COLLECTION);

        // Enforce uniqueness by ensuring there's no existing token for the same orgID
        await tokensCollection.updateOne({ orgID: orgID }, { $set: { token: token } }, { upsert: true });
        log(`✅ Token saved to MongoDB (or updated) for orgID: ${orgID}`);
        return true;

    } catch (error) {
        logError(`❌ Error saving token to MongoDB: ${error.message}`);
        return false;
    } finally {
        if (mongoClient) {
            try {
                await mongoClient.close();
                log("✅ MongoDB client closed after saving token.");
            } catch (closeError) {
                logError(`❌ Error closing MongoDB client: ${closeError}`);
            }
        }
    }
}

// --- InfluxDB: Get Org ID ---
async function getInfluxDBOrgID() {
    log("Starting InfluxDB Org ID retrieval...");
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));

    try {
        const signinResponse = await client.post(`${INFLUX_URL}/api/v2/signin`, null, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            auth: { username: INFLUX_USERNAME, password: INFLUX_PASSWORD }
        });

        if (signinResponse.status !== 204) {
            logError(`❌ Signin failed. Status: ${signinResponse.status}`);
            return null;
        }

        log('✅ InfluxDB session started.');

        const orgsResponse = await client.get(`${INFLUX_URL}/api/v2/orgs`);

        if (orgsResponse.status !== 200) {
            logError(`❌ Fetching orgs failed. Status: ${orgsResponse.status}. Data: ${JSON.stringify(orgsResponse.data)}`);
            return null;
        }

        const orgs = orgsResponse.data.orgs;

        if (orgs && orgs.length > 0) {
            const orgID = orgs[0].id;
            log(`✅ Org ID found: ${orgID}`);
            return orgID;
        } else {
            log("❌ No organizations found.");
            return null;
        }

    } catch (error) {
        logError(`❌ Error retrieving Org ID: ${error.message}`);
        if (error.response) logError(`Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        return null;
    }
}

// --- InfluxDB: Generate Token (Uses Org ID) ---
async function generateInfluxDBToken(orgID) {
    log("Starting InfluxDB token generation...");
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));

    try {
        // Step 1: Sign in (get the session cookie)
        await client.post(`${INFLUX_URL}/api/v2/signin`, null, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            auth: { username: INFLUX_USERNAME, password: INFLUX_PASSWORD }
        });

        log('✅ InfluxDB session started successfully');

        // Step 2: Create the token
        const res = await client.post(
            `${INFLUX_URL}/api/v2/authorizations`,
            {
                orgID: orgID,
                description: 'Token generado con user/pass',
                permissions: [
                    { action: 'read', resource: { type: 'buckets' } },
                    { action: 'write', resource: { type: 'buckets' } }
                ]
            }
        );

        log('✅ InfluxDB token generated successfully');
        return res.data.token; // Return the generated token
    } catch (err) {
        logError(`❌ InfluxDB Token Generation Error: ${err.message}`);
        if (err.response) {
            logError(`  Status code: ${err.response.status}`);
            logError(`  Response data: ${JSON.stringify(err.response.data)}`);
        }
        return null; // Return null if token generation fails
    }
}

// --- MongoDB Superuser Creation/Update ---
async function createOrUpdateSuperUser() {
    log("Creating or updating superuser in MongoDB...");
    let mongoClient;
    try {
        mongoClient = new MongoClient(MONGO_URL);
        await mongoClient.connect();
        const db = mongoClient.db(MONGODB_NAME);
        const collection = db.collection('users');
        const now = new Date();
        let hashedPassword = null;

        if (SUPERUSER_PASSWORD) {
            hashedPassword = await hash(SUPERUSER_PASSWORD, 10);
        }

        const existingUser = await collection.findOne({ role: 'SUPERUSER' });

        if (existingUser) {
            const updateFields = { updatedAt: now };

            if (SUPERUSER_EMAIL) updateFields.email = SUPERUSER_EMAIL;
            if (hashedPassword) updateFields.password = hashedPassword;

            const result = await collection.updateOne({ _id: existingUser._id }, { $set: updateFields });
            log("✅ Superuser updated in MongoDB.");
            log(`Update result: ${JSON.stringify(result)}`);

        } else {
            if (!SUPERUSER_EMAIL || !SUPERUSER_PASSWORD) {
                logError("❌ Error creating superuser: Email and password are required.");
                return;
            }

            if (!hashedPassword) hashedPassword = await hash(SUPERUSER_PASSWORD, 10);

            const superUser = {
                email: SUPERUSER_EMAIL,
                password: hashedPassword,
                role: 'SUPERUSER',
                createdAt: now,
                updatedAt: now
            };

            const result = await collection.insertOne(superUser);
            log("✅ Superuser created in MongoDB with ID:", result.insertedId);
            log(`Insert result: ${JSON.stringify(result)}`);
        }

    } catch (error) {
        logError(`❌ Error creating/updating superuser: ${error}`);
    } finally {
        if (mongoClient) {
            try {
                await mongoClient.close();
                log("✅ MongoDB client closed.");
            } catch (closeError) {
                logError(`❌ Error closing MongoDB client: ${closeError}`);
            }
        }
    }
}

// --- Main Execution ---
async function runSetup() {
    log("Starting combined setup...");
    try {
        //Create user mongo
        const userCreated = await createMongoDBUser(MONGODB_NAME, MONGODB_USER, MONGODB_PASSWORD);

        if(userCreated){
          log(`✅ MongoDB user ${MONGODB_NEW_USER} was created`);
        } else {
          logError(`❌ MongoDB user ${MONGODB_NEW_USER} could not be created`);
        }

        const orgID = await getInfluxDBOrgID();
        if (!orgID) {
            logError("❌ Failed to retrieve InfluxDB Org ID. Aborting.");
            process.exit(1);
        }

        // Check if token exists in MongoDB
        let influxDBToken = await getExistingTokenFromMongo(orgID);

        if (!influxDBToken) {
            log("❌ No existing InfluxDB token found. Generating a new one.");
            influxDBToken = await generateInfluxDBToken(orgID);

            if (influxDBToken) {
                log(`✅ New InfluxDB Token generated: ${influxDBToken}`);
                // Save the token to MongoDB
                const saveSuccess = await saveTokenToMongo(orgID, influxDBToken);
                if (!saveSuccess) {
                    logError("❌ Failed to save the new InfluxDB token to MongoDB.");
                }
            } else {
                logError("❌ Failed to generate InfluxDB token. Continuing with MongoDB.");
            }
        } else {
            log(`✅ Using existing InfluxDB token from MongoDB: ${influxDBToken.substring(0, 8)}...`); // Show first 8 chars
        }

        if (influxDBToken) {
            process.env.INFLUXDB_TOKEN = influxDBToken; // Set as env var
        }

        await createOrUpdateSuperUser();
        log("✅ Combined setup complete.");

    } catch (error) {
        logError(`❌ Combined setup failed: ${error}`);
        process.exit(1);
    }
}

runSetup();