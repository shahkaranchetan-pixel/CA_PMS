import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { clientId, number, date, dueDate, notes, items } = body;

        if (!clientId || !number || !date || !dueDate || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const invoice = await prisma.invoice.create({
            data: {
                clientId,
                number,
                date: new Date(date),
                dueDate: new Date(dueDate),
                notes,
                status: 'sent',
                items: {
                    create: items.map((i: any) => ({
                        description: i.description,
                        amount: parseFloat(i.amount)
                    }))
                }
            }
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error: any) {
        console.error('Invoice creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
