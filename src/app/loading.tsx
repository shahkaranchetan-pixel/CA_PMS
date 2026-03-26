import React from 'react';

export default function Loading() {
    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <div style={{ width: '200px', height: '32px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                    <div style={{ width: '150px', height: '16px', background: 'var(--surface2)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                </div>
                <div style={{ width: '100px', height: '36px', background: 'var(--surface2)', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ height: '100px', background: 'var(--surface2)', borderRadius: '14px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                ))}
            </div>

            <div style={{ height: '300px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
