import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ClientsPage() {
    const clients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Clients</h1>
                <Link
                    href="/clients/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                    Add Client
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GSTIN</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAN</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {clients.map((client: any) => (
                            <tr key={client.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600 hover:underline">
                                    <Link href={`/clients/${client.id}`}>
                                        {client.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{client.entityType}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{client.gstin || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{client.pan || '-'}</td>
                            </tr>
                        ))}
                        {clients.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                    No clients found. Add your first client.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
