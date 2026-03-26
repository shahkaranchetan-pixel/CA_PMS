"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

export default function SearchInput() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement !== inputRef.current) {
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
                    return;
                }
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
                ref={inputRef}
                type="text" 
                placeholder="Search tasks or clients... (/)" 
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
