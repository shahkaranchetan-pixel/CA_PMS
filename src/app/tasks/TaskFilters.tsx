'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function TaskFilters({ currentUserId }: { currentUserId: string | undefined }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentAssignee = searchParams.get('assignee') || 'all';
    const currentType = searchParams.get('type') || 'all';

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === 'all') {
                params.delete(name);
            } else {
                params.set(name, value);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleAssigneeChange = (val: string) => {
        router.push(`/tasks?${createQueryString('assignee', val)}`);
    };

    const handleTypeChange = (val: string) => {
        router.push(`/tasks?${createQueryString('type', val)}`);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">View:</span>
                <select
                    value={currentAssignee}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white/70 backdrop-blur-sm p-2 border"
                >
                    <option value="all">Team Tasks</option>
                    {currentUserId && <option value={currentUserId}>My Tasks</option>}
                </select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Filter Type:</span>
                <select
                    value={currentType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white/70 backdrop-blur-sm p-2 border"
                >
                    <option value="all">All Types</option>
                    <option value="TDS_PAYMENT">TDS Payment (7th)</option>
                    <option value="GST_1">GSTR-1 (10th)</option>
                    <option value="PF_ESI_PT">PF/ESI/PT (15th)</option>
                    <option value="GSTR_3B">GSTR-3B (20th)</option>
                    <option value="ACCOUNTING">Accounting</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>

            <div className="ml-auto">
                <button className="bg-white/70 hover:bg-white border text-gray-700 text-sm py-2 px-4 rounded-md shadow-sm transition">
                    🔄 Generate Monthly Tasks
                </button>
            </div>
        </div>
    );
}
