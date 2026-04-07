import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ClientListClient from "./ClientListClient"

export const revalidate = 30

export default async function ClientsPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/login")
    }

    // Parallelize client and template queries
    const [clientsRaw, templates] = await Promise.all([
        prisma.client.findMany({
            where: { deletedAt: null },
            include: {
                tasks: {
                    where: { deletedAt: null },
                    select: {
                        status: true,
                        dueDate: true,
                        updatedAt: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        }),
        prisma.taskTemplate.findMany({
            orderBy: { name: 'asc' }
        })
    ]);

    const now = new Date();
    const clients = clientsRaw.map(c => {
        const total = c.tasks.length;
        const overdue = c.tasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < now).length;
        const blocked = c.tasks.filter(t => t.status === 'BLOCKED').length;
        const active = c.tasks.filter(t => t.status !== 'COMPLETED').length;
        
        // Calculate Score
        let score = 100;
        score -= (overdue * 15);
        score -= (blocked * 10);
        if (total > 0 && active === 0) score = 100; // All done
        score = Math.max(0, Math.min(100, score));

        // Last Activity
        const lastTaskUpdate = c.tasks.length > 0 
            ? new Date(Math.max(...c.tasks.map(t => new Date(t.updatedAt).getTime())))
            : c.updatedAt;

        return {
            ...c,
            healthScore: score,
            lastActivity: lastTaskUpdate,
            overdueCount: overdue,
            activeCount: active
        };
    });

    return (
        <ClientListClient initialClients={clients} templates={templates} employees={[]} />
    )
}
