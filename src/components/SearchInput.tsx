"use client"

import { useRouter, useSearchParams } from "next/navigation"

export default function SearchInput() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        const params = new URLSearchParams(searchParams.toString())
        if (val) {
            params.set('q', val)
        } else {
            params.delete('q')
        }
        router.push(`/tasks?${params.toString()}`)
    }

    return (
        <div className="sbox">
            <span style={{ color: 'var(--muted)' }}>🔍</span>
            <input 
                type="text" 
                placeholder="Search tasks or clients..." 
                defaultValue={searchParams.get('q') || ''} 
                onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString())
                    if (e.target.value) params.set('q', e.target.value)
                    else params.delete('q')
                    router.push(`/tasks?${params.toString()}`)
                }} 
            />
        </div>
    )
}
