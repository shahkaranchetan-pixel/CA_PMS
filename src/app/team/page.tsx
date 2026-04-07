import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import EmployeeWorkloadCard from "./EmployeeWorkloadCard"

export const revalidate = 30

export default async function TeamPage() {
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    const teamRaw = await prisma.user.findMany({
        orderBy: { name: 'asc' },
        include: {
            taskAssignees: {
                where: { task: { deletedAt: null } },
                include: {
                    task: {
                        select: { id: true, status: true, priority: true, dueDate: true, title: true }
                    }
                }
            }
        }
    });

    const team = teamRaw.map(u => ({
        ...u,
        tasks: u.taskAssignees.map(ta => ta.task)
    }));

    // List of all members for the reassign dropdown
    const allMembers = team.map(m => ({ id: m.id, name: m.name || "Unknown" }));
    const now = new Date();

    return (
        <div>
            <div className="topbar">
                <div>
                    <div className="ptitle">Team Workload</div>
                    <div className="psub">Capacity planning · Monitor team workload and redistribute tasks</div>
                </div>
                <div className="sep" />
                <Link href="/team/new" className="btn btn-p">+ Add Employee</Link>
            </div>

            {/* Summary Stats */}
            <div className="stats-dashboard">
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#4FACFE' }} />
                    <div style={{ fontSize: '18px' }}>👥</div>
                    <div className="scard-val" style={{ color: '#4FACFE' }}>{team.length}</div>
                    <div className="scard-lbl">Team Members</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#FFB020' }} />
                    <div style={{ fontSize: '18px' }}>📋</div>
                    <div className="scard-val" style={{ color: '#FFB020' }}>
                        {team.reduce((acc, m) => acc + m.tasks.filter(t => t.status !== 'COMPLETED').length, 0)}
                    </div>
                    <div className="scard-lbl">Active Tasks</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#FF5757' }} />
                    <div style={{ fontSize: '18px' }}>⚠️</div>
                    <div className="scard-val" style={{ color: '#FF5757' }}>
                        {team.reduce((acc, m) => acc + m.tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED').length, 0)}
                    </div>
                    <div className="scard-lbl">Overdue Tasks</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#B89AFF' }} />
                    <div style={{ fontSize: '18px' }}>🚧</div>
                    <div className="scard-val" style={{ color: '#B89AFF' }}>
                        {team.reduce((acc, m) => acc + m.tasks.filter(t => t.status === 'BLOCKED').length, 0)}
                    </div>
                    <div className="scard-lbl">Blocked Tasks</div>
                </div>
            </div>

            {/* Workload Cards */}
            <div className="workload-grid">
                {team.map(member => (
                    <EmployeeWorkloadCard 
                        key={member.id} 
                        member={member} 
                        allMembers={allMembers} 
                        now={now} 
                        isAdmin={isAdmin}
                    />
                ))}
            </div>
        </div>
    )
}
