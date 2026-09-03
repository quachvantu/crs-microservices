import { useCallback, useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { createApiKey, getApiKeys, revokeApiKey } from '../api/apiKeyApi';
import type { ApiErrorResponse } from '../types/apiError';
import type { ApiKey } from '../types/apiKey';

function extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const data = error.response?.data;
        if (data?.message) return data.message;
        if (data) {
            const firstFieldError = Object.values(data).find((value) => typeof value === 'string');
            if (firstFieldError) return firstFieldError;
        }
    }
    return 'Da xay ra loi, vui long thu lai.';
}

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [ownerName, setOwnerName] = useState('');
    const [scopes, setScopes] = useState('courses:read');
    const [validDays, setValidDays] = useState('30');
    const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadKeys = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getApiKeys();
            setKeys(response.data);
            setError(null);
        } catch (loadError) {
            setError(extractErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadKeys();
    }, [loadKeys]);

    const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        setNewKeyValue(null);
        try {
            const response = await createApiKey({
                ownerName: ownerName.trim(),
                scopes: scopes.trim(),
                validDays: validDays ? Number(validDays) : undefined,
            });
            setNewKeyValue(response.data.keyValue);
            setOwnerName('');
            await loadKeys();
        } catch (createError) {
            setError(extractErrorMessage(createError));
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async (key: ApiKey) => {
        if (!window.confirm(`Thu hoi API Key cua "${key.ownerName}"?`)) return;
        try {
            await revokeApiKey(key.id);
            await loadKeys();
        } catch (revokeError) {
            setError(extractErrorMessage(revokeError));
        }
    };

    return (
        <main style={{ padding: 24, maxWidth: 900, margin: '0 auto', textAlign: 'left' }}>
            <h1>Quan ly API Key doi tac</h1>
            <p style={{ marginBottom: 24 }}>Cap phat va thu hoi quyen truy cap cho doi tac ngoai.</p>

            <form onSubmit={handleCreate} style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8, marginBottom: 24 }}>
                <h2>Cap API Key moi</h2>
                <label style={{ display: 'block', marginBottom: 12 }}>
                    Ten doi tac
                    <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} required style={{ display: 'block', width: '100%', marginTop: 4, boxSizing: 'border-box' }} />
                </label>
                <label style={{ display: 'block', marginBottom: 12 }}>
                    Scopes (cach nhau boi dau phay)
                    <input value={scopes} onChange={(event) => setScopes(event.target.value)} required style={{ display: 'block', width: '100%', marginTop: 4, boxSizing: 'border-box' }} />
                </label>
                <label style={{ display: 'block', marginBottom: 12 }}>
                    Hieu luc (so ngay, de trong = vinh vien)
                    <input type="number" min="1" value={validDays} onChange={(event) => setValidDays(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 4, boxSizing: 'border-box' }} />
                </label>
                {error && <p style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</p>}
                <button type="submit" disabled={submitting}>{submitting ? 'Dang cap...' : 'Cap API Key'}</button>
            </form>

            {newKeyValue && (
                <section style={{ background: '#fef9c3', padding: 12, borderRadius: 8, marginBottom: 24 }}>
                    <strong>Key vua tao, hay luu lai ngay:</strong>
                    <pre style={{ userSelect: 'all', overflowX: 'auto' }}>{newKeyValue}</pre>
                </section>
            )}

            <h2>Danh sach API Key</h2>
            {loading ? (
                <p>Dang tai...</p>
            ) : keys.length === 0 ? (
                <p>Chua co API Key nao.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #333' }}>
                                <th>Doi tac</th>
                                <th>Scopes</th>
                                <th>Trang thai</th>
                                <th>Het han</th>
                                <th>Thao tac</th>
                            </tr>
                        </thead>
                        <tbody>
                            {keys.map((key) => (
                                <tr key={key.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td>{key.ownerName}</td>
                                    <td>{key.scopes}</td>
                                    <td style={{ color: key.status === 'ACTIVE' ? '#15803d' : '#b91c1c' }}>{key.status}</td>
                                    <td>{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString('vi-VN') : 'Vinh vien'}</td>
                                    <td>
                                        {key.status === 'ACTIVE' && <button onClick={() => void handleRevoke(key)}>Thu hoi</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
