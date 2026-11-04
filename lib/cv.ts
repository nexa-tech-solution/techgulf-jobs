import { deleteObject, getStorage, ref, uploadBytes } from "firebase/storage";
import { app } from "@/lib/firebase";

const MAX_BYTES = 5 * 1024 * 1024;
// Browsers can leave file.type empty for Word files, so the type comes from the extension
const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Stores the CV at a fixed path, so each upload replaces the previous one. */
export async function uploadCv(uid: string, file: File) {
  const contentType = TYPES[file.name.split(".").pop()?.toLowerCase() ?? ""];
  if (!contentType || file.size > MAX_BYTES) throw new Error("CV must be a PDF, DOC or DOCX of at most 5 MB");
  const cvPath = `users/${uid}/cv/current`;
  await uploadBytes(ref(getStorage(app), cvPath), file, { contentType, customMetadata: { originalName: file.name } });
  // Only called after the user ticks the consent box, so this records when they agreed
  return { cvName: file.name, cvPath, cvConsentAt: new Date().toISOString() };
}

/** Removes the stored CV. A file that is already gone counts as deleted. */
export async function deleteCv(uid: string) {
  try {
    await deleteObject(ref(getStorage(app), `users/${uid}/cv/current`));
  } catch (error) {
    if ((error as { code?: string }).code !== "storage/object-not-found") throw error;
  }
}
