import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation"

export default async function EmployeesPage() {
    const session = await getServerSession(authOptions)

    // Check if user is admin (Assuming checking name for now if role isn't populated properly in session)
    // Real implementation should check `session.user.role === 'ADMIN'`
    // Assuming for demo purposes, the first user or designated user is admin

    const employees = await prisma.user.findMany({
        orderBy: {
            role: 'asc' // Admins first
        }
    })

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                <Link
                    href="/employees/new"
                    className="premium-btn text-sm"
                >
                    + Invite Employee
                </Link>
            </div>

            <div className="glass-panel overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white/50">
                        {employees.map((emp: any) => (
                            <tr key={emp.id} className="hover:bg-gray-50/50 transition duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold mr-3 shadow-sm">
                                            {emp.name ? emp.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        {emp.name || 'Unnamed User'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {emp.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${emp.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-green-100 text-green-800 border border-green-200'
                                        }`}>
                                        {emp.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(emp.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-red-500 hover:text-red-700 transition" disabled={emp.role === 'ADMIN'}>
                                        {emp.role === 'ADMIN' ? '' : 'Revoke Access'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
