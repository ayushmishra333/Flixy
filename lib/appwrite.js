import { Account, Avatars, Client, Databases, ID, Query, Storage } from 'react-native-appwrite';
import * as MailComposer from 'expo-mail-composer';

export const config = {
    endpoint: "https://cloud.appwrite.io/v1",
    platform: "com.snow.flixy",
    projectId: "66dff03c001665e23607",
    storageId: "66dff4e8000db5238fca",
    databaseId: "66dff2670006377a945e",
    userCollectionId: "66dff286003656d68304",
    videoCollectionId: "66dff2a900287d286ae2",
};

const {
  endpoint,
    platform,
    projectId,
    storageId,
    databaseId,
    userCollectionId,
    videoCollectionId,
} = config;

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(endpoint) // Your Appwrite Endpoint
    .setProject(projectId) // Your project ID
    .setPlatform(platform) // Your application ID or bundle ID.
    ;

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

export const createUser = async (email, password, username) => {
    // Register User
    try {
        const newAccount = await account.create(
           ID.unique(),
           email,
           password,
           username
         );

        if (!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(username);

        await signIn(email, password);

        const newUser = await databases.createDocument(
           databaseId,
           userCollectionId,
           ID.unique(),
           {
             accountId: newAccount.$id,
             email: email,
             username: username,
             avatar: avatarUrl,
           }
         );

         return newUser;
      } catch (error) {
        throw new Error(error);
      }
}

// Sign In
export const signIn = async(email, password) => {
    try {
      const session = await account.createEmailPasswordSession(email,password);

      return session;
    } catch (error) {
      throw new Error(error);
    }
  }

// Sign Out
export const signOut = async () => {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Current User
export const getCurrentUser = async () => {
    try {
      const currentAccount = await account.get();

      if (!currentAccount) throw Error;

      const currentUser = await databases.listDocuments(
        databaseId,
        userCollectionId,
        [Query.equal("accountId", currentAccount.$id)]
      );

      if (!currentUser) throw Error;

      return currentUser.documents[0];
    } catch (error) {
      console.log(error);
      return null;
    }
  }

// Get all video Posts
export const getAllPosts = async() => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.orderDesc("$createdAt")]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get latest created video posts
export const getLatestPosts = async() => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts that matches search query
export const searchPosts = async (query) => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.search("title", query)]
    );

    if (!posts) throw new Error("Something went wrong");

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts created by user
export const getUserPosts = async (userId) => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Upload File
export const uploadFile = async (file, type) => {
  if (!file) return;

  const { mimeType, ...rest } = file;
  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri
  };

  try {
    const uploadedFile = await storage.createFile(
      storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Get File Preview
export const getFilePreview = async (fileId, type) => {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export const createVideoPost = async (form) => {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      databaseId,
      videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

// Send Account Deletion Email
export const sendAccountDeletionEmail = async (userId) => {
  const emailBody = `
    Dear Admin,

    I would like to request the deletion of my account associated with the Flixy platform. Below are my account details:

    Username: ${userId.username}
    Email: ${userId.email}
    Account ID: ${userId.$id}

    I understand that the deletion process may take up to 48 hours.
    Thank you for your assistance.

    Best regards,
    ${userId.username}
  `;

  const options = {
    recipients: ['ayushmishra333@gmail.com'],  // Replace with admin email
    subject: 'Account Deletion Request',
    body: emailBody,
  };

  // Send email using expo-mail-composer
  try {
    await MailComposer.composeAsync(options);
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
};

// Handle Account Deletion Request (User Perspective)
export const requestAccountDeletion = async (userId) => {
  try {
    // Send the email notification to the admin
    await sendAccountDeletionEmail(userId);
  } catch (error) {
    console.error("Error processing account deletion request: ", error);
    throw new Error("Failed to submit deletion request");
  }
};