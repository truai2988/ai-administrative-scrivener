import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const availableIds = new Set<string>();

    // 1. generated ディレクトリをスキャン (CLI生成結果)
    const generatedDir = path.join(process.cwd(), 'generated');
    if (fs.existsSync(generatedDir)) {
      const folders = fs.readdirSync(generatedDir, { withFileTypes: true });
      folders.forEach((dirent) => {
        if (dirent.isDirectory()) {
          availableIds.add(dirent.name);
        }
      });
    }

    // 2. src/lib/schemas ディレクトリをスキャン (本番移行済みスキーマ)
    const schemasDir = path.join(process.cwd(), 'src', 'lib', 'schemas');
    if (fs.existsSync(schemasDir)) {
      const files = fs.readdirSync(schemasDir);
      files.forEach((file) => {
        if (file.endsWith('Schema.ts')) {
          const id = file.replace('Schema.ts', '');
          // フォームとは関係ないシステムスキーマを除外
          if (id !== 'organization' && id !== 'support') {
            availableIds.add(id);
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: Array.from(availableIds).sort(),
    });
  } catch (error: unknown) {
    console.error('Failed to read available templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read templates' },
      { status: 500 }
    );
  }
}
