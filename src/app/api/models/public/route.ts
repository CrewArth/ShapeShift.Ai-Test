import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { connectToDatabase } from '@/lib/mongodb'
import Model from '@/models/Model'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()
    const models = await Model.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(20)

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Error fetching public models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch public models' },
      { status: 500 }
    )
  }
} 