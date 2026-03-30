import admin from "firebase-admin";
import { appConfig } from "../../config";
import { CustomError } from "../../classes/error";

const { firebaseAdmin } = appConfig;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: firebaseAdmin.projectId,
      credential: admin.credential.cert({
        clientEmail: firebaseAdmin.clientEmail,
        privateKey: firebaseAdmin.privateKey?.replace(/\\n/g, '\n'),
        projectId: firebaseAdmin.projectId,
      }),
    });
  } catch (error: any) {
    console.log(error.message);
    throw new CustomError(401, "Unable to initialize authentication service");
  }
}

export const auth = admin.auth();

export default {
  auth,
};
