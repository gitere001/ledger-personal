import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await prisma.personalSavingsAccount.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(accounts)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const account = await prisma.personalSavingsAccount.create({
    data: { name: name.trim() },
  })
  return NextResponse.json(account)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '0')

  await prisma.personalSavingsAccount.update({
    where: { id },
    data: { isActive: true },
  })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '0')

  await prisma.personalSavingsAccount.update({
    where: { id },
    data: { isActive: false },
  })
  return NextResponse.json({ success: true })
}
