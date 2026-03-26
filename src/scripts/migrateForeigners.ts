import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { DEFAULT_BRANCH_ID } from "../types/database";

const COLLECTION_NAME = "foreigners";
const BATCH_SIZE = 500; // Firestore batch limit is 500

/**
 * 既存のForeignerデータのうち、branchIdを持たないものに対して
 * 一律で本部直轄(hq_direct)のbranchIdを付与するマイグレーションスクリプト
 */
export async function migrateExistingForeignersToHq(): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  try {
    console.log("Starting migration of existing foreigners to HQ branch...");
    const foreignersRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(foreignersRef);
    
    let migratedCount = 0;
    let batch = writeBatch(db);
    let currentBatchSize = 0;

    for (const document of snapshot.docs) {
      const data = document.data();
      
      // branchIdが存在しない、または空文字の場合に更新
      if (!data.branchId) {
        const docRef = doc(db, COLLECTION_NAME, document.id);
        batch.update(docRef, { 
          branchId: DEFAULT_BRANCH_ID,
          updatedAt: new Date().toISOString() // 念のため更新日時も更新
        });
        
        migratedCount++;
        currentBatchSize++;

        // Firestoreのバッチ上限（500件）に達したらコミットして新しいバッチを作成
        if (currentBatchSize >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Commited batch of ${currentBatchSize} updates.`);
          batch = writeBatch(db);
          currentBatchSize = 0;
        }
      }
    }

    // 残りのバッチをコミット
    if (currentBatchSize > 0) {
      await batch.commit();
      console.log(`Commited final batch of ${currentBatchSize} updates.`);
    }

    console.log(`Migration completed successfully. Migrated ${migratedCount} documents.`);
    return { success: true, migratedCount };
  } catch (error) {
    console.error("Migration failed:", error);
    return { success: false, migratedCount: 0, error: String(error) };
  }
}
