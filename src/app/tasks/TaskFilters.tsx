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
        <div className="card" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="field" style={{ margin: 0, minWidth: '200px' }}>
                <label>Assignee View</label>
                <select
                    value={currentAssignee}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                >
                    <option value="all">Team Tasks (All)</option>
                    {currentUserId && <option value={currentUserId}>My Assigned Tasks</option>}
                </select>
            </div>

            <div className="field" style={{ margin: 0, minWidth: '250px' }}>
                <label>Compliance Type</label>
                <select
                    value={currentType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                >
                    <option value="all">All Task Types</option>
                    <option value="TDS_PAYMENT">TDS Payment (7th)</option>
                    <option value="GST_1">GSTR-1 (10th)</option>
                    <option value="PF_ESI_PT">PF / ESI / PT (15th)</option>
                    <option value="GSTR_3B">GSTR-3B (20th)</option>
                    <option value="ACCOUNTING">Accounting / Bookkeeping</option>
                    <option value="OTHER">Other Custom Tasks</option>
                </select>
            </div>

            <div style={{ marginLeft: 'auto' }}>
                <button className="btn btn-g">
                    🔄 Auto-Generate Monthly
                </button>
            </div>
        </div>
    );
}
